import { NextResponse } from "next/server";
import { loginAsAdmin, loginAsDataEntry, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { password, role } = await request.json();

    if (role === "admin") {
      const valid = await loginAsAdmin(password);
      if (!valid) {
        return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
      }
      await setSession("admin");
      return NextResponse.json({ success: true, role: "admin" });
    }

    if (role === "data-entry") {
      const valid = await loginAsDataEntry(password);
      if (!valid) {
        return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
      }
      await setSession("data-entry");
      return NextResponse.json({ success: true, role: "data-entry" });
    }

    return NextResponse.json({ error: "دور غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
