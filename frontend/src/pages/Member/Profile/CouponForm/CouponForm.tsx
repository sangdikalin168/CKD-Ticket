import { useEffect, useRef, useState } from "react";
import {
  useCreateCouponPaymentMutation,
  useGetCouponCardLazyQuery,
} from "../../../../generated/graphql";
import { useReactToPrint } from "react-to-print";
import { Search } from "lucide-react";
import { CouponInvoice } from "../../../../components/ComponentToPrint/CouponInvoice";
import { TypeOptions, toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MagnetChip } from "@/components/board/MagnetChip";
import { formatMoney } from "@/lib/money";

const notify = (
  message: string,
  auto_Close: boolean | number,
  toastType: TypeOptions
) => {
  if (!toast.isActive("alert")) {
    toast(message, {
      autoClose: auto_Close ? 5000 : false,
      toastId: "alert",
      type: toastType,
    });
  }
};

export const CouponPayment = (props: any) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLInputElement>(null);

  const [findCouponCard, { data, loading, refetch }] =
    useGetCouponCardLazyQuery({ fetchPolicy: "no-cache" });

  const FindCoupon = async (code: string) => {
    await findCouponCard({
      variables: {
        couponCode: code,
      },
    });
    inputEl.current?.select();
  };

  const [coupon_code, setCouponCode] = useState("");
  const [payment_id, setPaymentID] = useState(0);
  const [btn_sell_status, setBtnSellStatus] = useState(false);

  const [createCouponPayment] = useCreateCouponPaymentMutation();

  const CreateCouponPayment = async () => {
    setBtnSellStatus(true);

    // Hide Or Disable Sell Button To advoice duplicate data
    const result = await createCouponPayment({
      variables: {
        userId: props.user_id,
        customerId: props.customer_id,
        cardName: data?.GetCouponCard[0].card_name ?? "",
        price: data?.GetCouponCard[0].price ?? 0,
        quantity: data?.GetCouponCard[0].quantity ?? 0,
        couponCode: coupon_code,
      },
    });

    if (result.data?.CreateCouponPayment.success) {
      props.setIsOpenCoupon(false);
      setPaymentID(result.data.CreateCouponPayment.payment_id);
      return;
    }

    notify("Coupon Payment Error", true, "error");
  };

  const handlePrint1 = async (target: HTMLIFrameElement) => {
    return new Promise(() => {
      console.log("forwarding print request to the main process...");
      const data = target.contentWindow!.document.documentElement.outerHTML;
      const blob = new Blob([data], { type: "text/html; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      (window as any).electronAPI.printComponent(url, (response: any) => {
        console.log("Main: ", response);
      });
    });
  };
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    print: async (printIframe: HTMLIFrameElement) => {
      // Do whatever you want here, including asynchronous work
      await handlePrint1(printIframe);
    },
  });

  const date_time_format = (date_time: Date) => {
    const date = new Date(date_time);
    return date.toLocaleDateString("fr-CA");
  };

  useEffect(() => {
    // This function will be called after the component re-renders
    if (payment_id > 0) {
      buttonRef.current?.click();
      refetch();
    }
  }, [payment_id]);

  const card = data?.GetCouponCard?.[0];

  return (
    <>
      <button
        className="hidden"
        ref={buttonRef}
        type="button"
        onClick={handlePrint}
      >
        Print
      </button>

      <Dialog open={props.open_coupon} onOpenChange={props.setIsOpenCoupon}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>លក់គូប៉ុន</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              FindCoupon(coupon_code);
            }}
          >
            <Label htmlFor="coupon-code">សូមបញ្ចុលលេខកូដគូប៉ុន</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                type="text"
                required
                autoFocus
                ref={inputEl}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <Button type="submit" variant="outline" disabled={loading}>
                <Search aria-hidden="true" />
                ស្វែងរក
              </Button>
            </div>
          </form>

          {loading ? (
            <p className="text-sm text-ink-soft">Loading...</p>
          ) : data ? (
            card ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-tray p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{card.card_name}</p>
                  <p className="text-price font-black leading-none text-ink">{formatMoney(card.price)}</p>
                </div>
                <Button
                  disabled={btn_sell_status}
                  type="button"
                  variant="commit"
                  size="lg"
                  onClick={() => CreateCouponPayment()}
                >
                  លក់
                </Button>
              </div>
            ) : (
              <MagnetChip tone="rejected" size="md">Coupon Not Found</MagnetChip>
            )
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                props.setIsOpenCoupon(false);
              }}
            >
              បោះបង់
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="hidden">
        {card ? (
          <CouponInvoice
            ref={componentRef}
            invoice_id={payment_id}
            payment_date={date_time_format(new Date())}
            cashier={localStorage.getItem("display_name")}
            c_name={props.customer_name}
            phone={props.phone}
            promotion={card.card_name || "null"}
            price={card.price || "null"}
          />
        ) : null}
      </div>
    </>
  );
};
