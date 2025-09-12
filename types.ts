export enum AppState {
  IDLE,
  PROCESSING,
  RESULT,
  ERROR,
}

export interface TransformedImage {
  name: string;
  description: string;
  imageUrl: string;
  isLoading?: boolean;
}
