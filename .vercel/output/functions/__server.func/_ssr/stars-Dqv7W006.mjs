import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as Star } from "../_libs/lucide-react.mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stars-Dqv7W006.js
var import_jsx_runtime = require_jsx_runtime();
function Stars({ value, className }) {
	const rounded = Math.round(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center gap-0.5", className),
		"aria-label": `${value.toFixed(1)} out of 5`,
		children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-3.5", i < rounded ? "fill-primary text-primary" : "text-border") }, i))
	});
}
//#endregion
export { Stars as t };
