import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ShopActions = () => (
  <Card className="border-slate-800 bg-slate-900 text-slate-100">
    <CardHeader>
      <CardTitle className="text-lg">Shop actions</CardTitle>
      <CardDescription className="text-slate-400">Trimmed actions for commerce.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2">
      <Button size="sm">Create promo</Button>
      <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-100 hover:bg-slate-700">
        Mark shipped
      </Button>
      <Button size="sm" variant="ghost" className="text-slate-300 hover:text-slate-50">
        Refund</Button>
    </CardContent>
  </Card>
);

export default ShopActions;
