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

<is:modal title="${message(code: 'is.ui.workspaces')}"
          form="openWorkspace(workspace)"
          submitButton="${message(code: 'todo.is.ui.open')}"
          class="modal-split">
    <div class="row">
        <div class="col-sm-3 modal-split-left">
            <div class="modal-split-search">
                <input type="text"
                       ng-model="workspaceSearch"
                       ng-change="searchWorkspaces()"
                       ng-model-options="{debounce: 300}"
                       class="form-control search-input"
                       placeholder="${message(code: 'todo.is.ui.search.action')}">
            </div>
            <ul class="nav nav-pills flex-column">
                <li class="nav-item"
                    ng-repeat="currentWorkspace in workspaces">
                    <a class="nav-link"
                       ng-class="{'active': currentWorkspace.id == workspace.id && currentWorkspace.class == workspace.class}"
                       ng-click="selectWorkspace(currentWorkspace)" href>
                        <i ng-if="currentWorkspace.pkey && !currentWorkspace.preferences.hidden" class="fa fa-eye"></i>
                        <i class="workspace-icon" ng-class="{'icon-project': currentWorkspace.pkey, 'icon-portfolio': currentWorkspace.fkey}"></i>
                        {{ currentWorkspace.name }}
                    </a>
                </li>
            </ul>
            <div class="modal-split-pagination">
                <div uib-pagination
                     boundary-links="true"
                     previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;"
                     class="pagination-sm justify-content-center mt-2"
                     max-size="3"
                     total-items="workspaceCount"
                     items-per-page="workspacesPerPage"
                     ng-model="currentPage"
                     ng-change="searchWorkspaces()">
                </div>
            </div>
        </div>
        <div class="col-sm-9 modal-split-right" ng-switch="workspaces != undefined && workspaces.length == 0 && summary">
            <div ng-switch-when="true">
                ${message(code: 'todo.is.ui.project.noproject')}
            </div>
            <div class="col-md-12" ng-switch-default>
                <div ng-include="summary"></div>
            </div>
        </div>
    </div>
</is:modal>