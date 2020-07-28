%{--
- Copyright (c) 2019 Kagilum.
-
- This file is part of iceScrum.
-
- iceScrum is free software: you can redistribute it and/or modify
- it under the terms of the GNU Affero General Public License as published by
- the Free Software Foundation, either version 3 of the License.
-
- iceScrum is distributed in the hope that it will be useful,
- but WITHOUT ANY WARRANTY; without even the implied warranty of
- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
- GNU General Public License for more details.
-
- You should have received a copy of the GNU Affero General Public License
- along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
-
- Authors:
-
- Vincent Barrier (vbarrier@kagilum.com)
- Nicolas Noullet (nnoullet@kagilum.com)
--}%

<script type="text/ng-template" id="story.value.html">
<is:modal form="submit(editableStory)"
          submitButton="${message(code: 'default.button.update.label')}"
          closeButton="${message(code: 'is.button.cancel')}"
          title="${message(code: 'todo.is.ui.story.estimate.value.by.comparison')}">
    <div class="slider-header row">
        <h5 class="col-md-1 text-right">${message(code: 'is.story.value')}</h5>
        <slider class="col-md-11"
                ng-model="editableStory.value"
                min="0" step="1" max="99" value="editableStory.value"
                on-stop-slide="updateTable()"></slider>
    </div>
    <p class="mt-3">${message(code: 'todo.is.ui.story.by.comparison')}</p>
    <div class="table-scrollable">
        <table class="table">
            <tr>
                <th ng-repeat="value in values"
                    ng-click="setValue(value)"
                    class="text-center">
                    <strong class="text-accent">{{ value }}</strong>
                    <span class="story-count">{{ count[$index] }} ${message(code: 'is.ui.backlog.title.details.stories')}</span>
                </th>
            </tr>
            <tr>
                <td ng-repeat="stories in storiesByValue">
                    <table class="table table-striped">
                        <tr ng-repeat="story in stories" title="{{ story.description | actorTag }}" ng-class="{ 'story-active' : story.id == editableStory.id }">
                            <td>
                                <strong class="story-id">{{ story.uid }}</strong>&nbsp;&nbsp;{{ story.name }}
                                <div class="text-right"><strong class="story-state">{{ story.state | i18n:'StoryStates' }}</strong></div>
                            </td>
                        </tr>
                        <tr ng-if="count[$index] > 3">
                            <td class="text-center story-more">{{ message('todo.is.ui.story.by.comparison.count', [(count[$index] - 3)]) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</is:modal>
</script>
