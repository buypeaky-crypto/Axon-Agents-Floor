import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-D4aGTNTQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md bg-secondary px-3 text-sm text-foreground shadow-[0_0_0_1px_rgb(236_234_228/0.1)] outline-none transition-[box-shadow,background-color] duration-150 placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_rgb(216_212_200/0.55)] disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
//#endregion
export { Input as t };
