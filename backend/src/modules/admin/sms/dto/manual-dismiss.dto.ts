export enum ManualSmsResolution {
  DISMISSED = 'dismissed',
  LINKED_ELSEWHERE = 'linked_elsewhere',
  INVALID = 'invalid',
}

export type ManualDismissDto = {
  smsId: string;
  resolution: ManualSmsResolution;
  note?: string;
};

