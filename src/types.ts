export type ToneType = "專業" | "簡潔" | "詳細";

export type LanguageType = "繁體中文" | "English" | "日本語" | "韓語" | "簡體中文";

export type FocusType = "綜合總結" | "待辦事項與行動" | "核心決策與討論";

export interface GenerateConfig {
  tone: ToneType;
  language: LanguageType;
  focus: FocusType;
}

export interface MeetingRecord {
  id: string;
  title: string;
  createdAt: string;
  transcript: string;
  result: string;
  config: GenerateConfig;
}
