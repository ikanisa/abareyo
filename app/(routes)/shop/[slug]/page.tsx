import PageShell from "@/app/_components/shell/PageShell";
import UssdPayButton from "@/app/_components/payments/UssdPayButton";

export default function PDP({ params }: { params: { slug: string } }) {
  const price = 25000;

  return (
    <PageShell>
      <section className="card" data-product-slug={params.slug}>
        <div className="h-52 rounded-2xl bg-white/10" />
        <h1 className="mt-3">Home Jersey 24/25</h1>
        <div className="muted">Official merchandise</div>

        <div className="mt-3 grid grid-cols-6 gap-2" role="radiogroup" aria-label="Size">
          {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
            <button key={s} className="tile text-center" role="radio" aria-checked={s === "M"}>
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <UssdPayButton amount={price} />
        </div>
      </section>
    </PageShell>
  );
}
