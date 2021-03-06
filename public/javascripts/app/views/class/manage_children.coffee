class Kin.Class.ManageChildrenView extends Backbone.View

  el: null

  tplUrl: '/templates/main/class/manage_children.html'

  events:
    "submit #add-child-form" : "addChild"

  render: ()->
    that = @
    $.tmpload
      url: @tplUrl
      onLoad: (tpl)->
        $(that.el).html(tpl({profile: that.model}))

        that.childrenList = new Kin.Class.ChildrenListView
          el: that.$("#children-list")
          collection: that.collection
          model: that.model
        that.childrenList.render()

        that.$("form").validate()

  addChild: (ev)->
    ev.preventDefault()
    that = @
    hashedData = @$(ev.target).hashForm()
    if hashedData.birthday
      hashedData.birthday = "#{hashedData.birthday.year}-#{hashedData.birthday.month}-#{hashedData.birthday.day}"
    childModel = new Kin.ChildModel
    childModel.save hashedData,
      success: ()->
        childName = hashedData.name
        childSurname = hashedData.surname
        $.jGrowl("#{childName} #{childSurname} successfully added to this group")
        that.render()
        Kin.app.pub "manage_children:step", "added_child"
      error: ()->
        $.jGrowl("There was an error adding the child :( Please try again.")

  remove: ()->
    @unbind()
    $(@el).unbind().empty()