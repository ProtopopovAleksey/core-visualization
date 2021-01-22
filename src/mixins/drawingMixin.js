export default {
  methods: {
    $_drawMaterial(materialData, fill, container) {
      container
        .append("rect")
        .attr("width", this.wellViewWidth)
        .attr(
          "height",
          this.new_yScale(materialData[1]) - this.new_yScale(materialData[0])
        )
        .attr("x", 0)
        .attr("y", this.new_yScale(materialData[0]))
        .attr("fill", fill);
    },
    $_drawPoint(point, context, x_scale, y_scale, color, line_width) {
      var cx = x_scale(point.value);
      var cy = y_scale(point.depth);
    
      context.fillStyle = color;
      context.strokeStyle = color;
      context.beginPath();
      context.arc(cx, cy, line_width, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
      context.stroke();
    },
  }
}