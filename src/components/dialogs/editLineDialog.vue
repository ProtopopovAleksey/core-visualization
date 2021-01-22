<template>
  <v-dialog v-model="editLineDialog" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">Параметры линии</span>
      </v-card-title>
      <v-card-text class="text-right">
        <v-row>
          <v-col cols="3">
            <p>Тип линии:</p>
          </v-col>
          <v-col cols="4" class="pt-2">
            <v-select
              class="pt-0 mt-0"
              :items="lineTypes"
              v-model="editLineData.style"
              return-object
            >
            </v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <p>Толщина линии:</p>
          </v-col>
          <v-col cols="4" class="pt-2">
            <v-text-field
              type="number"
              class="pt-0 mt-0"
              step="0.1"
              v-model="editLineData.lineWidth"
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <p>Цвет линии:</p>
          </v-col>
          <v-col class="text-left">
            <input type="color" v-model="editLineData.color">
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <p>Логарифмический масштаб:</p>
          </v-col>
          <v-col class="text-left">
            <v-switch
              class="mt-1"
              v-model="editLineData.log"
            ></v-switch>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="mr-4 pb-2">
        <v-spacer></v-spacer>
        <v-btn large text @click="editLineParamsCancel">Отмена</v-btn>
        <v-btn large color="primary" @click="editLineParamsSubmitted" text>Принять</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    name: "editLineDialog",
    props: ['editLineDialog', 'editLineData'],
    data() {
      return {
        lineTypes: [
          {
            text: 'Сплошная',
            value: 'line'
          },
          {
            text: 'Точечная',
            value: 'dot'
          }],
      }
    },
    methods: {
      editLineParamsCancel() {
        this.$emit('editLineParamsCancel')
      },
      editLineParamsSubmitted() {
        this.$emit('editLineParamsSubmitted')
      },
    }
  }
</script>

<style scoped>

</style>
