/**
 * Shop identity printed at the top of every receipt.
 *
 * These strings used to be literals inside a React component
 * (components/ComponentToPrint/index.tsx), which meant renaming a branch needed
 * a frontend rebuild and a redeploy to every till. They are server config now.
 */
export const shopProfile = {
    name: process.env.SHOP_NAME || "មិង ហួរក្លឹបហាត់ប្រាណ & អាងហែលទឹក",
    branch: process.env.SHOP_BRANCH || "(សាខាចំការដូង)",
    footer: process.env.RECEIPT_FOOTER || "សូមអរគុណ!",
};
