import { z } from "zod";

// User details from the proxy API
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  shopifyStoreUrl: z.string(),
  mypostAccessToken: z.string().nullable(),
  mypostAccountNumber: z.string().nullable(),
  shopifyAccessToken: z.string().nullable(),
  mypostRefreshToken: z.string().nullable(),
  isOnboardingDone: z.boolean(),
  totalShipmentsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  locale: z.string().nullable(),
  timezone: z.string().nullable(),
  lastLogin: z.string().nullable(),
  billingPlan: z.string().nullable(),
  billingCycleEnd: z.string().nullable(),
  defaultLocation: z.string().nullable(),
  defaultPostagePackageOption: z.string().nullable(),
  defaultPrintingOption: z.string().nullable(),
  shopName: z.string().nullable(),
  otherPreferences: z.string().nullable(),
  productPackagingMap: z.string().nullable(),
});

export type MerchantUser = z.infer<typeof userSchema>;

export const schema = z.array(userSchema);

export type OutputType = z.infer<typeof schema>;

const PROXY_API_URL = 'https://auspost-proxy.whoszsubham.workers.dev/api/pc-users/zT8wL$u1oVr!ENq3p@KdWm26CYx9Abfj';

export const getMerchantUsers = async (): Promise<OutputType> => {
  const result = await fetch(PROXY_API_URL, {
    method: "GET",
    headers: {
      "accept": "*/*",
      "origin": window.location.origin,
    },
  });

  if (!result.ok) {
    throw new Error(`Failed to fetch merchant users: ${result.statusText}`);
  }

  const data = await result.json();
  return schema.parse(data);
};
