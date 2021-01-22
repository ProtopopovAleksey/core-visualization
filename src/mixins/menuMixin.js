import * as d3 from "d3";

export default {
  computed: {
    menu() {
      let moveGisChildren = this.gisIndexes.map(index => {
        return {
          title: index + 1,
          action: (elm, d, i) => {
            this.moveGis(d, index, this.track_num);
          }
        };
      });
      moveGisChildren.push({
        title: "Новый",
        action: (elm, d, i) => {
          this.moveGis(d, -1, this.track_num);
        }
      });
    
      let moveTrackChildren = this.gisIndexes.map(index => {
        return {
          title: index + 1,
          action: (elm, d, i) => {
            this.moveTrack(d, index, this.track_num);
          }
        };
      });
    
      return [
        {
          title: "Переместить ГИС »",
          action: (elm, d, i) => {
          },
          children: moveGisChildren
        },
        {
          title: "Переместить трек »",
          action: (elm, d, i) => {
          },
          children: moveTrackChildren
        },
        {
          title: "Параметры линии",
          children: [],
          action: (elm, d, i) => {
            this.lineParam(d, i, this.track_num);
          }
        },
        {
          title: "Скрыть линию",
          children: [],
          action: (elm, d, i) => {
            this.disableLine(d, i, this.track_num);
          }
        }
      ];
    }
  },
  methods: {
    contextMenu(menu, data) {
      // create the div element that will hold the context menu
      d3.selectAll(".d3-context-menu")
        .data([1])
        .enter()
        .append("div")
        .attr("class", "d3-context-menu");
    
      // close menu
      d3.select("body").on("click.d3-context-menu", () => {
        d3.select(".d3-context-menu").style("display", "none");
      });
    
      var elm = this;
    
      d3.selectAll(".d3-context-menu").html("");
      var list = d3.selectAll(".d3-context-menu").append("ul");
      list
        .selectAll("li")
        .data(menu)
        .enter()
        .append("li")
        .html(function (d) {
          return d.title;
        })
        .on("click", (d, i) => {
          d.action(elm, data, i);
          d3.select(".d3-context-menu").style("display", "none");
        })
        .on("mouseenter", function (d, i) {
          if (d.children.length > 0) {
            d3.select(this)
              .append("div")
              .attr("class", "d3-context-menu__child")
              .style("top", i * 24 + "px")
              .append("ul")
              .selectAll("li")
              .data(d.children)
              .enter()
              .append("li")
              .html(function (d) {
                return d.title;
              })
              .on("mouseover", function (d, i) {
              })
              .on("click", function (d, i) {
                d.action(elm, data, i);
                d3.select(".d3-context-menu").style("display", "none");
              })
              .on("mouseout", function (d, i) {
              });
          } else return false;
        })
        .on("mouseleave", function (d, i) {
          if (d.children.length > 0) {
            d3.select(".d3-context-menu__child").remove();
          }
        });
    
      // display context menu
      d3.select(".d3-context-menu")
        .style("left", d3.event.pageX - 2 + "px")
        .style("top", d3.event.pageY - 2 + "px")
        .style("display", "block");
    
      d3.event.preventDefault();
    }
  }
}