import { site } from "@/lib/site";

export function HomeIntro() {
  return (
    <main>
      <p className="status">{site.projectState}</p>
      <h1>{site.productName}</h1>
      <p>{site.productSummary}</p>
    </main>
  );
}
