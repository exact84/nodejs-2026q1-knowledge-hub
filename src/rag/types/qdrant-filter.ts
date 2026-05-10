export type QdrantFilter = {
  must?: Array<{
    key: string;
    match: {
      value: string;
    };
  }>;
};
