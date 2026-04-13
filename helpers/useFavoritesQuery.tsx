import { useQuery } from "@tanstack/react-query";
import superjson from "superjson";

export const useFavoritesQuery = () => {
  return useQuery<number[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/_api/favorites");
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return superjson.parse<number[]>(await res.text());
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
