<%@ page import="org.icescrum.core.support.ApplicationSupport" %>
%{--
- Copyright (c) 2015 Kagilum SAS.
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
<is:modal name="formHolder.profileForm"
          form="update(editableUser)"
          validate="true"
          submitButton="${message(code: 'is.button.update')}"
          closeButton="${message(code: 'is.button.cancel')}"
          title="${message(code: 'is.dialog.profile')}">
    <uib-tabset type="pills" justified="true" class="tab-pane-higher">
        <uib-tab heading="${message(code: 'todo.is.ui.profile.general.title')}">
            <div flow-files-added="editableUser.avatar = 'custom';"
                 flow-files-submitted="$flow.upload()"
                 flow-files-success="editableUser.avatar = 'custom'"
                 flow-file-added="!! {png:1,jpg:1,jpeg:1} [$file.getExtension()]"
                 flow-init="{target:'${createLink(controller: 'user', action: 'update', id: user.id)}', singleFile:true, simultaneousUploads:1}"
                 flow-single-file="true"
                 flow-drop>
                <div class="row">
                    <div class="form-half">
                        <label for="username">${message(code: 'is.user.username')}</label>
                        <p class="form-control-plaintext">${user.username.encodeAsHTML()}</p>
                    </div>
                    <div class="form-half">
                        <label for="userAvatar">${message(code: 'is.user.avatar')}</label>
                        <div class="user-avatars form-control-plaintext">
                            <div class="col-md-12">
                                <g:if test="${ApplicationSupport.booleanValue(grailsApplication.config.icescrum.gravatar?.enable)}">
                                    <img ng-click="editableUser.avatar = 'gravatar'"
                                         ng-class="{'selected': editableUser.avatar == 'gravatar' }"
                                         src="${"https://secure.gravatar.com/avatar/" + user.email.encodeAsMD5()}"/>
                                </g:if>
                                <img ng-click="editableUser.avatar = 'initials'"
                                     ng-class="{'selected': editableUser.avatar == 'initials' }"
                                     ng-src="{{ editableUser | userInitialsAvatar }}"/>
                                <img ng-click="editableUser.avatar = 'dev-ico.png'"
                                     ng-class="{'selected': editableUser.avatar == 'dev-ico.png' }"
                                     src="${asset.assetPath(src: 'avatars/dev-ico.png')}"/>
                                <img ng-click="editableUser.avatar = 'po-ico.png'"
                                     ng-class="{'selected': editableUser.avatar == 'po-ico.png' }"
                                     src="${asset.assetPath(src: 'avatars/po-ico.png')}"/>
                                <img ng-click="editableUser.avatar = 'sh-ico.png'"
                                     ng-class="{'selected': editableUser.avatar == 'sh-ico.png' }"
                                     src="${asset.assetPath(src: 'avatars/sh-ico.png')}"/>
                                <img ng-click="editableUser.avatar = 'sm-ico.png'"
                                     ng-class="{'selected': editableUser.avatar == 'sm-ico.png' }"
                                     src="${asset.assetPath(src: 'avatars/sm-ico.png')}"/>
                                <img ng-click="editableUser.avatar = 'admin-ico.png'"
                                     ng-class="{'selected': editableUser.avatar == 'admin-ico.png' }"
                                     src="${asset.assetPath(src: 'avatars/admin-ico.png')}"/>
                                <div class="choose-file">
                                    <span ng-hide="editableUser.avatar == 'custom'"
                                          flow-btn class="btn btn-secondary btn-sm"><i class="fa fa-photo"></i></span>
                                    <img flow-btn
                                         ng-hide="editableUser.avatar != 'custom'"
                                         ng-class="{'selected': editableUser.avatar == 'custom'}"
                                         flow-img="$flow.files[0] ? $flow.files[0] : null"/>
                                </div>
                            </div>
                            <input type="hidden"
                                   name="user.avatar"
                                   ng-model="editableUser.avatar"/>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="form-half">
                        <label for="user.firstName">${message(code: 'is.user.firstname')}</label>
                        <input at
                               type="text"
                               class="form-control"
                               autocomplete="off"
                               name="user.firstName"
                               ng-model="editableUser.firstName"
                               autofocus
                               required/>
                    </div>
                    <div class="form-half">
                        <label for="user.lastName">${message(code: 'is.user.lastname')}</label>
                        <input at
                               type="text"
                               autocomplete="off"
                               class="form-control"
                               name="user.lastName"
                               ng-model="editableUser.lastName"
                               required/>
                    </div>
                </div>
                <div class="row">
                    <div class="form-half">
                        <label for="user.email">${message(code: 'is.user.email')}</label>
                        <input type="email"
                               name="user.email"
                               autocomplete="off"
                               class="form-control"
                               ng-model="editableUser.email"
                               ng-blur="refreshAvatar(editableUser)"
                               required/>
                    </div>
                    <div class="form-half">
                        <label for="user.preferences.language">${message(code: 'is.user.preferences.language')}</label>
                        <ui-select name="user.preferences.language"
                                   class="form-control"
                                   ng-model="editableUser.preferences.language">
                            <ui-select-match>{{ languages[$select.selected] }}</ui-select-match>
                            <ui-select-choices
                                    repeat="languageKey in languageKeys">{{ languages[languageKey] }}</ui-select-choices>
                        </ui-select>
                    </div>
                </div>
                <div class="row" ng-if="!editableUser.accountExternal">
                    <div class="form-half">
                        <label for="user.password">${message(code: 'is.user.password')}</label>
                        <input name="user.password"
                               type="password"
                               class="form-control"
                               ng-model="editableUser.password"
                               ng-password-strength>
                    </div>
                    <div class="form-half">
                        <label for="confirmPassword">${message(code: 'is.login.register.confirmPassword')}</label>
                        <input name="confirmPassword"
                               type="password"
                               class="form-control"
                               is-match="editableUser.password"
                               ng-model="editableUser.confirmPassword">
                    </div>
                </div>
                <div class="row">
                    <div class="form-half">
                        <label for="user.preferences.activity">${message(code: 'is.user.preferences.activity')}</label>
                        <input name="user.preferences.activity"
                               autocomplete="off"
                               type="text"
                               class="form-control"
                               ng-model="editableUser.preferences.activity">
                    </div>
                    <div class="form-half">
                        <label for="user.preferences.colorScheme">${message(code: 'is.ui.colorScheme')}</label>
                        <ui-select name="user.preferences.colorScheme"
                                   class="form-control"
                                   ng-model="editableUser.preferences.colorScheme">
                            <ui-select-match placeholder="{{ message('is.ui.colorScheme.default') }}">{{ colorSchemes[$select.selected] }}</ui-select-match>
                            <ui-select-choices repeat="colorSchemeKey in colorSchemeKeys">{{ colorSchemes[colorSchemeKey] }}</ui-select-choices>
                        </ui-select>
                    </div>
                </div>
                <div>
                    <a class="text-muted small"
                       href="mailto:${ApplicationSupport.getFirstAdministrator()?.email}">
                        <strong>${message(code: 'is.ui.admin.contact.data', args: [ApplicationSupport.getFirstAdministrator()?.email])}</strong>
                    </a>
                </div>
                <entry:point id="user-dialog-profile-tab-general-after-form"/>
            </div>
        </uib-tab>
        <entry:point id="user-dialog-profile-tab"/>
        <uib-tab heading="${message(code: 'is.ui.token.title')}">
            <div class="token-tab" ng-controller="UserTokenCtrl">
                <p class="form-text">
                    ${message(code: 'is.ui.token.title.description')}
                </p>
                <div class="row is-form-row">
                    <div class="form-half">
                        <label for="userToken.name">${message(code: 'is.user.token.name')}</label>
                        <div class="input-group" hotkey="{'return': save }" hotkey-allow-in="INPUT">
                            <input type="text"
                                   name="userToken.name"
                                   autocomplete="off"
                                   class="form-control"
                                   placeholder="${message(code: 'is.user.token.name.placeholder')}"
                                   ng-model="editableUserToken.name">
                            <span class="input-group-append">
                                <button type="button"
                                        ng-click="save()"
                                        ng-disabled="!editableUserToken.name"
                                        class="btn btn-primary btn-sm">
                                    ${message(code: 'is.ui.token.generate')}
                                </button>
                            </span>
                        </div>
                    </div>
                    <div class="form-half">
                        <label for="userToken.sampleURL">${message(code: 'is.ui.token.sampleUrl')}</label>
                        <div class="form-control-plaintext text-break">
                            {{:: serverUrl + '/ws/project/YOURPROJ' }}
                        </div>
                    </div>
                </div>
                <table class="table table-bordered table-striped" ng-if="user.tokens_count > 0">
                    <thead>
                        <tr>
                            <th>${message(code: 'is.user.token')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr ng-repeat="token in user.tokens">
                            <td>
                                <div class="float-left">
                                    {{ token.id }}<div class="small">{{ token.name }}</div>
                                </div>
                                <div class="float-right">
                                    <button type="button"
                                            class="btn btn-secondary btn-sm"
                                            defer-tooltip="${message(code: 'is.ui.copy.to.clipboard')}"
                                            ng-click="copyToClipboard(token.id)">
                                        <i class="fa fa-clipboard"></i>
                                    </button>
                                    <button type="button"
                                            class="btn btn-danger btn-sm"
                                            ng-click="delete(token)"
                                            defer-tooltip="${message(code: 'is.ui.token.revoke')}">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="text-center font-size-sm mt-4 mb-2">
                    <a target="_blank"
                       class="text-primary"
                       href="{{:: serverUrl + '/api' }}">
                        ${message(code: 'is.ui.documentation.api')}
                    </a>
                </div>
                <entry:point id="user-dialog-token-tab-general-after-form"/>
            </div>
        </uib-tab>
        <g:if test="${projects}">
            <uib-tab heading="${message(code: 'is.dialog.profile.emailsSettings')}">
                <table class="table table-bordered table-striped">
                    <tr>
                        <th class="text-center" style="width: 25%; vertical-align: middle;">${message(code: 'is.project')}</th>
                        <th class="text-center" style="width: 25%; vertical-align: middle;">${message(code: 'is.dialog.profile.emailsSettings.autoFollow')}</th>
                        <th class="text-center" style="width: 25%; vertical-align: middle;">${message(code: 'is.dialog.profile.emailsSettings.onStory')}</th>
                        <th class="text-center" style="width: 25%; vertical-align: middle;">${message(code: 'is.dialog.profile.emailsSettings.onUrgentTask')}</th>
                    </tr>
                    <g:each var="project" in="${projects}">
                        <tr class="text-center">
                            <td>${project.name.encodeAsHTML()}</td>
                            <td style="vertical-align: middle;">
                                <input type="checkbox"
                                       name="${project.id}-autoFollow"
                                       id="${project.id}-autoFollow"
                                       ng-model="emailsSettings.autoFollow['${project.pkey.encodeAsHTML()}']">
                            </td>
                            <td style="vertical-align: middle;">
                                <input type="checkbox"
                                       name="${project.id}-onStory"
                                       id="${project.id}-onStory"
                                       ng-model="emailsSettings.onStory['${project.pkey.encodeAsHTML()}']">
                            </td>
                            <td style="vertical-align: middle;">
                                <input type="checkbox"
                                       name="${project.id}-onUrgentTask"
                                       id="${project.id}-onUrgentTask"
                                       ng-model="emailsSettings.onUrgentTask['${project.pkey.encodeAsHTML()}']">
                            </td>
                        </tr>
                    </g:each>
                </table>
            </uib-tab>
        </g:if>
    </uib-tabset>
</is:modal>