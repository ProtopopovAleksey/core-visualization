<template>
  <gis-visualization :resultJson="resultJson"/>
</template>

<script>
  import gisVisualization from "@/components/gisVisualization";
  
  export default {
    name: "Home",
    components: {
      gisVisualization
    },
    data() {
      return {
        resultJson: null,
      }
    },
    beforeMount() {
      this.resultJson = require("@/assets/core-data.json");
    },
  }
</script>

<style scoped>

</style>