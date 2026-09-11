import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as cn } from "./axon-mark-C4BCwm3a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agent-sigil-uI5ei_zP.js
var import_jsx_runtime = require_jsx_runtime();
function hashSeed(seed) {
	let h = 2166136261;
	for (let i = 0; i < seed.length; i += 1) {
		h ^= seed.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
function AgentSigil({ seed, letter, className }) {
	const h = hashSeed(seed || letter || "A");
	const spokes = 3 + h % 5;
	const inner = 7 + h % 5;
	const outer = 14 + (h >> 4) % 5;
	const rot = h % 360;
	const glyph = (letter || seed || "A").replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase() || "A";
	const points = Array.from({ length: spokes }, (_, i) => {
		const a = Math.PI * 2 * i / spokes - Math.PI / 2;
		return {
			x: 20 + Math.cos(a) * outer,
			y: 20 + Math.sin(a) * outer
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 40 40",
		className: cn("size-12", className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "40",
				height: "40",
				rx: "12",
				className: "fill-secondary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				transform: `rotate(${rot} 20 20)`,
				className: "stroke-primary/55",
				fill: "none",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "20",
						cy: "20",
						r: inner,
						strokeWidth: "1.2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "20",
						cy: "20",
						r: outer,
						strokeWidth: "0.7",
						className: "stroke-primary/30"
					}),
					points.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: "20",
						y1: "20",
						x2: p.x,
						y2: p.y,
						strokeWidth: "0.9"
					}, i)),
					points.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: p.x,
						cy: p.y,
						r: "1.4",
						className: "fill-primary/80 stroke-none"
					}, `n-${i}`))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "20",
				y: "21.5",
				textAnchor: "middle",
				dominantBaseline: "middle",
				className: "fill-foreground",
				style: {
					fontFamily: "Fraunces, Georgia, serif",
					fontSize: "13px",
					fontWeight: 500
				},
				children: glyph
			})
		]
	});
}
//#endregion
export { AgentSigil as t };
