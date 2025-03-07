const dataAttributes = [
    {
        "key": "education_less_than_high_school_percent",
        "value": "Percent of population with education under high school (%)"
    },
    {
        "key": "percent_no_heath_insurance",
        "value": "Percent of population with no health insurance (%)"
    },
    {
        "key": "median_household_income",
        "value": "Median Household Income"
    },
    {
        "key": "poverty_perc",
        "value": "Poverty (%)"
    }
]

// Dropdown 

const dropdownA = d3.select("#map-title-a select")
const dropdownB = d3.select("#map-title-b select")

let defaultA = "percent_no_heath_insurance"
let defaultB = "education_less_than_high_school_percent"

dropdownA
    .selectAll("option")
    .data(Object.keys(visDescriptionLookup))
    .enter()
    .append("option")
    .attr("selected", key => key == defaultA ? "selected" : null)
    .attr("value", key => key)
    .text(key => visDescriptionLookup[key].title)

dropdownB
    .selectAll("option")
    .data(Object.keys(visDescriptionLookup))
    .enter()
    .append("option")
    .attr("selected", key => key == defaultB ? "selected" : null)
    .attr("value", key => key)
    .text(key => visDescriptionLookup[key].title)


    
    
Promise.all([
    d3.json("data/counties-10m.json"),
    d3.csv("data/data.csv"),
]).then(fetchedData => {

    const geoData = fetchedData[0];
    const data = fetchedData[1].filter(d => {
        let validValueForAttribute = true
        dataAttributes.forEach(attr => {
            if (d[attr.key] < 0) validValueForAttribute = false
        })
        return validValueForAttribute && d["County"] != "United States"
    });

    data.forEach(d => {
        dataAttributes.forEach(attr => {
            d[attr.key] = +d[attr.key];
        })
    });

    geoData.objects.counties.geometries.forEach(d => {
        for (let i = 0; i < data.length; i++) {
            if (d.properties.name == data[i]["County"]) {
                dataAttributes.forEach(attr => {
                    if (+data[i][attr.key] >= 0) {
                        d.properties[attr.key] = data[i][attr.key];
                    }
                })
            }
        }
    })

    let vis = new Visualization({
        A: 'percent_no_heath_insurance',
        B: 'education_less_than_high_school_percent',
    }, data, geoData);


    dropdownA.on("change", function (e) {
        vis.updateVisAttributeA(e.target.value);
        vis.updateTitles();
    })
    
    dropdownB.on("change", function (e) {
        vis.updateVisAttributeB(e.target.value);
        vis.updateTitles();
    })

}).catch(error => console.log("Error loading data:", error));

