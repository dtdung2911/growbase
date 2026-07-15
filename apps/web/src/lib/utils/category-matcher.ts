import type { CategoryGroupWithCategories } from "@/lib/hooks/useCategories"

type CategoryMatch = {
  categoryId: string
  categoryName: string
  groupName: string
  confidence: number
}

const KEYWORD_MAP: Record<string, string[]> = {
  "Siêu thị": ["vinmart", "co.op", "bach hoa", "sieu thi", "big c", "lotte", "mega market", "cho", "thuc pham"],
  "Điện": ["tien dien", "evn", "dien luc", "electricity"],
  "Nước": ["tien nuoc", "nuoc sach", "water"],
  "Xăng xe": ["xang", "petro", "gas station", "shell"],
  "Đỗ/Gửi xe": ["gui xe", "do xe", "parking", "bai xe"],
  "Phí thuê xe": ["grab", "be", "taxi", "gojek", "uber"],
  "Ăn uống ngoài": ["an uong", "nha hang", "quan an", "com", "pho", "bun", "cafe", "coffee", "highland", "starbucks", "tra sua"],
  "Movies/Coffee/Drinks": ["cgv", "galaxy", "lotte cinema", "phim", "movie", "karaoke"],
  "Du lịch": ["du lich", "travel", "booking", "agoda", "hotel", "khach san"],
  "Subscriptions/Dịch vụ số": ["netflix", "spotify", "youtube", "icloud", "apple", "google", "microsoft", "adobe"],
  "Thuốc men Y tế": ["thuoc", "nha thuoc", "pharmacy", "hospital", "benh vien"],
  "Credit Card Payment": ["credit card", "the tin dung", "thanh toan the"],
  "Trả nợ": ["tra no", "lai vay", "khoan vay", "loan"],
  "Chứng khoán": ["chung khoan", "stock", "securities", "vndirect", "ssi", "vps", "tcbs"],
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function matchCategory(
  description: string,
  categories: CategoryGroupWithCategories[]
): CategoryMatch | null {
  const normalized = normalizeText(description)
  if (!normalized) return null

  for (const group of categories) {
    for (const cat of group.categories) {
      const catKeywords = KEYWORD_MAP[cat.name]
      if (!catKeywords) continue

      for (const keyword of catKeywords) {
        if (normalized.includes(normalizeText(keyword))) {
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            groupName: group.name,
            confidence: 0.8,
          }
        }
      }
    }
  }

  for (const group of categories) {
    const groupNorm = normalizeText(group.name)
    if (normalized.includes(groupNorm)) {
      const firstCat = group.categories[0]
      if (firstCat) {
        return {
          categoryId: firstCat.id,
          categoryName: firstCat.name,
          groupName: group.name,
          confidence: 0.5,
        }
      }
    }
  }

  return null
}
