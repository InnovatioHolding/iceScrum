%{--
- Copyright (c) 2015 Kagilum.
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

<script type="text/ng-template" id="story.acceptanceTest.editor.html">
<form ng-submit="save(editableAcceptanceTest, selected)"
      name="formHolder.acceptanceTestForm"
      ng-class="['form-editable form-editing', formHolder.formExpanded ? 'form-expanded' : 'form-not-expanded']"
      novalidate>
    <div class="row is-form-row">
        <div class="form-group" ng-class="formHolder.formExpanded ? 'col-sm-8' : 'col-sm-12'">
            <div class="input-group">
                <input required
                       autofocus
                       type="text"
                       ng-maxlength="255"
                       autocomplete="off"
                       name="name"
                       ng-model="editableAcceptanceTest.name"
                       ng-focus="formHolder.formExpanded = true;"
                       class="form-control"
                       placeholder="${message(code: 'is.acceptanceTest')}">
                <span class="input-group-append visible-hidden">
                    <button class="btn btn-primary btn-sm"
                            type="button"
                            ng-click="formHolder.formExpanded = true;">
                        <i class="fa fa-plus"></i>
                    </button>
                </span>
            </div>
        </div>
        <div class="col-sm-4 form-group hidden-not-expanded">
            <ui-select class="form-control"
                       name="state"
                       ng-model="editableAcceptanceTest.state"
                       ng-disabled="!authorizedAcceptanceTest('updateState', selected)">
                <ui-select-match>
                    <span ng-class="'text-'+($select.selected | acceptanceTestColor)"><i class='fa fa-check'></i> {{ $select.selected | i18n:'AcceptanceTestStates' }}</span>
                </ui-select-match>
                <ui-select-choices repeat="acceptanceTestState in acceptanceTestStates">
                    <span ng-class="'text-'+(acceptanceTestState | acceptanceTestColor)"><i class='fa fa-check'></i> {{ acceptanceTestState | i18n:'AcceptanceTestStates' }}</span>
                </ui-select-choices>
            </ui-select>
        </div>
    </div>
    <div class="form-group hidden-not-expanded">
        <textarea at
                  is-markitup
                  class="form-control"
                  ng-maxlength="1000"
                  name="description"
                  ng-model="editableAcceptanceTest.description"
                  is-model-html="editableAcceptanceTest.description_html"
                  ng-show="showAcceptanceTestDescriptionTextarea"
                  placeholder="${message(code: 'is.ui.backlogelement.nodescription')}"></textarea>
        <div class="markitup-preview form-control"
             ng-show="!showAcceptanceTestDescriptionTextarea"
             ng-click="showAcceptanceTestDescriptionTextarea = true"
             ng-focus="focusAcceptanceTestDescription()"
             ng-class="{'placeholder': !editableAcceptanceTest.description_html}"
             tabindex="0"
             ng-bind-html="editableAcceptanceTest.description_html ? editableAcceptanceTest.description_html : '<p>${message(code: 'is.backlogelement.description')}</p>'"></div>
    </div>
    <div class="btn-toolbar">
        <button class="btn btn-primary btn-sm float-right"
                ng-disabled="!formHolder.acceptanceTestForm.$dirty || formHolder.acceptanceTestForm.$invalid || application.submitting"
                type="submit">
            ${message(code: 'default.button.create.label')}
        </button>
        <button class="btn btn-secondary btn-sm float-right"
                ng-click="formHolder.formExpanded = false; resetAcceptanceTestForm(true)"
                type="button">
            ${message(code: 'is.button.cancel')}
        </button>
    </div>
</form>
</script>
