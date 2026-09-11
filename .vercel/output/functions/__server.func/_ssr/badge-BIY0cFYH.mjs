import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-BIY0cFYH.js
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-secondary text-muted-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.1)]",
		solid: "bg-primary text-primary-foreground",
		outline: "text-muted-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.14)]"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
export { Badge as t };
