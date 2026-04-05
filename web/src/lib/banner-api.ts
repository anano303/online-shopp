import { getActiveBanners } from "@/modules/admin/api/banner";
import { Banner, BannerType } from "@/types/banner";

// Fetch only main banners (for homepage slider)
export async function fetchActiveBanners(): Promise<Banner[]> {
  try {
    const result = await getActiveBanners(BannerType.MAIN);
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching active banners:", error);
    return [];
  }
}
