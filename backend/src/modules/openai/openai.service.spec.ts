import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';

import {
  OpenAiRequestError,
  OpenAiService,
  OpenAiUnavailableError,
  type OpenAiFactory,
} from './openai.service.js';

describe('OpenAiService', () => {
  const createConfig = (values: Record<string, string | undefined>): ConfigService => {
    return {
      get: (key: string) => values[key],
    } as unknown as ConfigService;
  };

  const createClient = () => {
    const responses = {
      create: jest.fn(),
      parse: jest.fn(),
    };

    const client = { responses } as unknown as OpenAI;
    return { client, responses };
  };

  it('disables the client when API key is missing', async () => {
    const config = createConfig({ 'openai.apiKey': undefined });
    const factory = jest.fn();

    const service = new OpenAiService(config, factory as unknown as OpenAiFactory);

    expect(service.isEnabled).toBe(false);
    await expect(
      service.responsesCreate({ model: 'gpt-4o-mini', input: [] } as Parameters<OpenAI['responses']['create']>[0]),
    ).rejects.toBeInstanceOf(OpenAiUnavailableError);
    expect(factory).not.toHaveBeenCalled();
  });

  it('normalizes the base URL and proxies calls to the OpenAI client', async () => {
    const { client, responses } = createClient();
    responses.create.mockResolvedValue({ id: 'test' });
    responses.parse.mockRejectedValue({ status: 429, message: 'rate limited' });

    const factory = jest.fn(() => client);
    const config = createConfig({ 'openai.apiKey': 'test-key', 'openai.baseUrl': 'https://mock.local/v1/' });

    const service = new OpenAiService(config, factory as unknown as OpenAiFactory);

    expect(service.isEnabled).toBe(true);
    expect(factory).toHaveBeenCalledWith({ apiKey: 'test-key', baseURL: 'https://mock.local/v1' });

    await expect(
      service.responsesCreate({ model: 'gpt-4.1-mini', input: [] } as Parameters<OpenAI['responses']['create']>[0]),
    ).resolves.toEqual({ id: 'test' });
    expect(responses.create).toHaveBeenCalled();

    await expect(
      service.responsesParse({ model: 'gpt-4.1-mini', input: [] } as Parameters<OpenAI['responses']['parse']>[0]),
    ).rejects.toBeInstanceOf(OpenAiRequestError);
    expect(responses.parse).toHaveBeenCalled();
  });

  it('falls back to the default base URL when not provided', () => {
    const { client } = createClient();
    const factory = jest.fn(() => client);
    const config = createConfig({ 'openai.apiKey': 'key', 'openai.baseUrl': '   ' });

    const service = new OpenAiService(config, factory as unknown as OpenAiFactory);

    expect(service.getBaseUrl()).toBe('https://api.openai.com/v1');
    expect(factory).toHaveBeenCalledWith({ apiKey: 'key', baseURL: 'https://api.openai.com/v1' });
  });
});
