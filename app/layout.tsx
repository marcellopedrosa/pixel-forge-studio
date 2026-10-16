import type { ReactNode } from "react";
import "./globals.css";
export const metadata = { title: "PixelForge Studio", description: "Editor PSD em camadas" };
export default function Layout({children}:{children:ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html> }
