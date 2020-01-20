<template>
  <i-form class="panel-group" ref="form" :model="editingGroup" :rules="rules" :label-width="88" inline>
    <i-form-item label="分组重命名" prop="server">
      <i-input type="text" :value="groupTitle" @input="onInput"/>
    </i-form-item>
  </i-form>
</template>
<script>
import { mapState, mapMutations } from 'vuex'

export default {
  data () {
    return {
      rules: {
        group: { required: true, message: '请输入分组名' }
      }
    }
  },
  computed: {
    ...mapState(['editingGroup']),
    groupTitle () {
      return this.editingGroup.editingTitle === '$ungrouped$' ? '' : this.editingGroup.editingTitle
    }
  },
  methods: {
    ...mapMutations(['updateEditingTitle']),
    onInput (v) {
      this.updateEditingTitle(v)
    }
  }
}
</script>
