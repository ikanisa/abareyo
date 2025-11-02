import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const openURLMock = vi.fn<Promise<void>, [string]>();
const setStringAsyncMock = vi.fn<Promise<void>, [string]>();
let platformOS: "ios" | "android" = "ios";

const mockReactNative = () => {
  const React = require("react");
  return {
    Linking: { openURL: openURLMock },
    Platform: {
      get OS() {
        return platformOS;
      },
    },
    StyleSheet: { create: (styles: unknown) => styles },
    Text: ({ children, testID, ...props }: { children: React.ReactNode; testID?: string }) =>
      React.createElement("span", { "data-testid": testID, ...props }, children),
    TouchableOpacity: ({ children, onPress, testID, ...props }: any) =>
      React.createElement(
        "button",
        {
          type: "button",
          onClick: onPress,
          "data-testid": testID,
          ...props,
        },
        children,
      ),
    View: ({ children, testID, ...props }: { children: React.ReactNode; testID?: string }) =>
      React.createElement("div", { "data-testid": testID, ...props }, children),
  };
};

const importComponent = async () => {
  vi.resetModules();
  platformOS = "ios";
  openURLMock.mockReset();
  setStringAsyncMock.mockReset();
  process.env.EXPO_PUBLIC_ROLLOUT_USSD_COPY = "on";
  process.env.EXPO_PUBLIC_ROLLOUT_USSD_ANALYTICS = "on";

  vi.doMock("react-native", () => mockReactNative());
  vi.doMock("expo-clipboard", () => ({
    setStringAsync: setStringAsyncMock,
  }));

  const module = await import("@mobile/src/components/UssdPayButton");
  return { Component: module.UssdPayButton };
};

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("UssdPayButton (mobile)", () => {
  it("opens the dialer and copies the code on iOS", async () => {
    const { Component } = await importComponent();
    openURLMock.mockResolvedValue(undefined);
    setStringAsyncMock.mockResolvedValue(undefined);

    render(<Component amount={1800} phone="0780000000" />);

    const dialButton = screen.getByTestId("mobile-ussd-dial");
    await userEvent.click(dialButton);
    expect(openURLMock).toHaveBeenCalledWith("tel:*182*1*1*0780000000*1800%23");

    const copyButton = screen.getByTestId("mobile-ussd-copy");
    await userEvent.click(copyButton);
    expect(setStringAsyncMock).toHaveBeenCalledWith("*182*1*1*0780000000*1800#");
    expect(screen.getByText(/code copied/i)).toBeInTheDocument();
    expect(screen.getByTestId("mobile-ussd-display")).toHaveTextContent("*182*1*1*0780000000*1800#");
  });

  it("suppresses the fallback on Android and surfaces an error when dial fails", async () => {
    const { Component } = await importComponent();
    platformOS = "android";
    openURLMock.mockRejectedValue(new Error("dial failed"));

    render(<Component amount={2100} phone="0780000000" />);

    const dialButton = screen.getByTestId("mobile-ussd-dial");
    await userEvent.click(dialButton);

    expect(openURLMock).toHaveBeenCalledWith("tel:*182*1*1*0780000000*2100%23");
    expect(() => screen.getByTestId("mobile-ussd-copy")).toThrow();
    expect(setStringAsyncMock).not.toHaveBeenCalled();
    expect(screen.getByText(/dial failed/i)).toBeInTheDocument();
  });
});
