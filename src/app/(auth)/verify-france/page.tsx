import { AuthShell } from "@/components/layout/auth-shell";
import { ButtonLink, Card, Field, Input } from "@/components/ui";
import { CheckIcon } from "@/components/ui/icons";

function Stepper() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-[22px] h-[22px] rounded-full bg-success flex items-center justify-center">
          <CheckIcon width={12} height={12} className="text-deep" />
        </span>
        <span className="text-success text-xs font-semibold">Phone</span>
      </div>
      <div className="flex-1 h-0.5 bg-success" />
      <div className="flex items-center gap-1.5">
        <span className="w-[22px] h-[22px] rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
          2
        </span>
        <span className="text-ink text-xs font-semibold">Address</span>
      </div>
      <div className="flex-1 h-0.5 bg-line" />
      <div className="flex items-center gap-1.5">
        <span className="w-[22px] h-[22px] rounded-full bg-elevated border border-line text-faint text-[11px] font-bold flex items-center justify-center">
          3
        </span>
        <span className="text-faint text-xs font-medium">Done</span>
      </div>
    </div>
  );
}

export default function VerifyFrancePage() {
  return (
    <AuthShell width="max-w-[480px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-ink text-[22px] font-bold -tracking-[0.3px]">
          Verify you live in France
        </h1>
        <Stepper />
      </div>

      <Card className="px-[18px] py-4 flex items-center gap-3">
        <span className="w-[34px] h-[34px] rounded-full bg-success/10 flex items-center justify-center shrink-0">
          <CheckIcon width={12} height={12} className="text-success" />
        </span>
        <div className="flex flex-col gap-0.5">
          <div className="text-ink text-[13px] font-semibold">
            +33 6 12 45 78 90 verified
          </div>
          <div className="text-faint text-xs">SMS code confirmed</div>
        </div>
      </Card>

      <Card className="p-5 flex flex-col gap-4">
        <div className="text-ink text-[15px] font-semibold">Your address in France</div>
        <Field label="Street address">
          <Input defaultValue="14 rue de la République" />
        </Field>
        <div className="grid grid-cols-[1fr_1.4fr] gap-3">
          <Field label="Postal code">
            <Input defaultValue="69007" />
          </Field>
          <Field label="City">
            <Input defaultValue="Lyon" />
          </Field>
        </div>
      </Card>

      <ButtonLink href="/dashboard" className="w-full">
        Finish verification
      </ButtonLink>
    </AuthShell>
  );
}
