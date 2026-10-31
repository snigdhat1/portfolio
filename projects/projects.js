import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// puts the number of projects in the title so its like "12 Projects"
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects?.length ?? 0} Projects`;
}

// keeping both filters up here so the search and the pie click can see each other
// (this was the bug, before they each did their own thing and erased the other one)
// also saving the actual year instead of the wedge number because the wedges move around
// when you search and then the number ends up pointing at the wrong year
let query = '';
let selectedYear = null;

// gets the projects that have the search text anywhere in them, doesnt care about caps
function searchProjects() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

// does the search first, then the year if one is picked, then redraws everything
// the pie only uses the searched projects so it matches whats in the search
function update() {
  let searched = searchProjects();
  renderPieChart(searched);

  let visible =
    selectedYear === null
      ? searched
      : searched.filter((p) => p.year === selectedYear);
  renderProjects(visible, projectsContainer, 'h2');
}

// makes the pie chart and the legend, one slice per year
function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let arcs = arcData.map((d) => arcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // clears out the old pie and legend first or else they just keep stacking
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('style', `--color:${colors(i)}`)
      .attr('class', data[i].label === selectedYear ? 'selected' : '')
      .on('click', () => selectYear(data[i].label));
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectYear(d.label));
  });
}

// click a slice to pick that year, click it again to unpick it
function selectYear(year) {
  selectedYear = selectedYear === year ? null : year;
  update();
}

// every time you type it saves the text and redoes everything
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});

// draws everything once when the page first loads
update();
