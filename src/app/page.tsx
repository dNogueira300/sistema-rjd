import { redirect } from "next/navigation";

// El middleware ya redirige "/" al login o al panel según la sesión.
// Esto es solo un respaldo, sin pantalla de espera artificial.
export default function Home() {
  redirect("/auth/signin");
}
