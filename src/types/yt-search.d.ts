declare module 'yt-search' {
  export interface Video {
    videoId: string;
    title: string;
    thumbnail: string;
    timestamp?: string;
    ago?: string;
    views?: number;
    author?: { name: string };
  }

  export interface SearchResult {
    videos: Video[];
  }

  export default function yts(query: string): Promise<SearchResult>;
}