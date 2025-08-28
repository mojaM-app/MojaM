export interface ICommunityInfo {
  logoUrl?: string;
  email?: string;
  webPage?: string;
  phone?: string;
  address?: string;
  getMapsAddress(): string;
}

export interface ITab {
  title: string;
  content: string;
}

export interface ICommunity {
  info: ICommunityInfo;
  tabs: ITab[];
}
