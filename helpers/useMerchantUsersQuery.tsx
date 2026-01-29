import { useQuery } from "@tanstack/react-query";
import { getMerchantUsers, type MerchantUser } from "../endpoints/merchant-users_GET.schema";

export const useMerchantUsersQuery = () => {
  return useQuery({
    queryKey: ["merchantUsers"],
    queryFn: getMerchantUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes - this data doesn't change often
    refetchOnWindowFocus: false,
  });
};

export const useMerchantUserByEmail = (email: string | null | undefined) => {
  const { data: users, ...rest } = useMerchantUsersQuery();

  const user = users?.find((user: MerchantUser) =>
    user.email.toLowerCase() === email?.toLowerCase()
  );

  return {
    ...rest,
    data: user || null,
  };
};
