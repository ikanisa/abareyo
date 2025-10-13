import { notFound } from "next/navigation";

import PdpClientPage from "./PdpClientPage";
import { getProductBySlug } from "../_logic/useShop";

type Params = { params: { slug: string } };

const PDPPage = ({ params }: Params) => {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  return <PdpClientPage product={product} />;
};

export default PDPPage;
