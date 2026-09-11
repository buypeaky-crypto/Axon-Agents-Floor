//#region node_modules/.nitro/vite/services/ssr/assets/fee-BMu_kIqU.js
function houseFeeCents(priceCents) {
	if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
	return Math.floor(priceCents * 800 / 1e4);
}
function sellerNetCents(priceCents) {
	if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
	return priceCents - houseFeeCents(priceCents);
}
function formatFeePercent() {
	return `8%`;
}
//#endregion
export { houseFeeCents as n, sellerNetCents as r, formatFeePercent as t };
