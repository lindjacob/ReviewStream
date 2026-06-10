export type JsonErrorCode =
  | "invalid_hours"
  | "unknown_app"
  | "reviews_unavailable";

export type JsonErrorResponse = {
  error: {
    code: JsonErrorCode;
    message: string;
  };
};

export type AppsResponse = {
  apps: string[];
};

export type ReviewDto = {
  id: string;
  appId: string;
  author: string;
  title: string;
  content: string;
  rating: number;
  submittedAt: string;
};

export type ReviewsResponse = {
  reviews: ReviewDto[];
};
