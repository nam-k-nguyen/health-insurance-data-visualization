const histogramTitle = (attr) => `${attr} distribution across U.S. Counties`
const scatterPlotTitle = (attrA, attrB) => `${capitalizeFirstLetter(attrA)} vs ${attrB} across U.S. Counties`
const mapTitle = (attr) => `${attr} of all U.S. Counties`

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const visDescriptionLookup = {
    "percent_no_heath_insurance": {
        title: "Uninsured Rate",
        axis: "Uninsured (%)",
        mapLegend: "Uninsured population (%)",
        background: "#4E6E58",
        color: "#FFFFFF",
        tooltip: "% of population uninsured"
    },
    "education_less_than_high_school_percent": {
        title: "Below High School Rate",
        axis: "Below hs (%)",
        mapLegend: "Below high school population (%)",
        background: "#BA3F1D",
        color: "#FFFFFF",
        tooltip: "% of population below high school"
    },
    "median_household_income": {
        title: "Median Household Income",
        axis: "Income ($)",
        mapLegend: "Median Household Income ($)",
        background: "#FFBC42",
        color: "#000000",
        tooltip: "$ median household income"
    },
    "poverty_perc": {
        title: "Poverty Rate",
        axis: "Poverty (%)",
        mapLegend: "Porverty Rate (%)",
        background: "#F391A0",
        color: "#000000",
        tooltip: "% poverty rate"
    }
}