/*
 * Copyright (c) 2015 Kagilum SAS.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 * Colin Bontemps (cbontemps@kagilum.com)
 *
 */

var services = angular.module('services', ['restResource']);

services.service('Session', ['$timeout', '$http', '$rootScope', '$injector', 'UserService', 'User', 'PushService', 'IceScrumEventType', 'WorkspaceType', 'FormService', 'CacheService', function($timeout, $http, $rootScope, $injector, UserService, User, PushService, IceScrumEventType, WorkspaceType, FormService, CacheService) {
    var self = this;
    self.defaultView = '';
    self.user = new User();
    if (isSettings.workspace) {
        var workspaceConstructor = $injector.get(isSettings.workspace.class); // Get the ressource constructor, e.g. Portfolio or Project
        self.workspace = new workspaceConstructor();
        _.extend(self.workspace, isSettings.workspace);
        var workspaceType = self.workspace.class.toLowerCase();
        if (workspaceType === WorkspaceType.PROJECT) {
            var project = self.workspace;
            project.startDate = new Date(project.startDate);
            project.endDate = new Date(project.endDate);
        }
        CacheService.addOrUpdate(workspaceType, self.workspace);
        self.workspaceType = workspaceType;
    } else {
        self.workspace = {};
    }
    self.unreadActivitiesCount = 0;
    var defaultRoles = {
        businessOwner: false,
        portfolioStakeHolder: false,
        productOwner: false,
        scrumMaster: false,
        teamMember: false,
        stakeHolder: false,
        admin: false
    };
    self.roles = _.clone(defaultRoles);
    self.listeners = {};
    this.reload = function() {
        $timeout(function() {
            document.location.reload(true);
        }, 3500);
    };
    this.create = function(user, roles, defaultView) {
        _.extend(self.user, user);
        _.merge(self.roles, roles);
        self.defaultView = defaultView;
        if (self.authenticated()) {
            UserService.getUnreadActivities(self.user)
                .then(function(data) {
                    self.unreadActivitiesCount = data.unreadActivitiesCount;
                });
        }
        if (self.listeners.activity) {
            self.listeners.activity.unregister();
        }
        self.listeners.activity = PushService.registerListener('activity', IceScrumEventType.CREATE, function(activity) {
            if (activity.poster && self.user && activity.poster.id !== self.user.id) {
                self.unreadActivitiesCount += 1;
            }
        });
        if (self.listeners.user) {
            self.listeners.user.unregister();
        }
        self.listeners.user = PushService.registerListener('user', IceScrumEventType.UPDATE, function(user) {
            if (user.updatedRole) {
                var updatedRole = user.updatedRole;
                var updatedProject = updatedRole.project;
                if (updatedRole.role == undefined) {
                    $rootScope.notifyWarning($rootScope.message('is.user.role.removed.project') + ' ' + updatedProject.name);
                    if (self.workspace.class == 'Project' && updatedProject.id == self.workspace.id) {
                        $timeout(function() {
                            document.location = $rootScope.serverUrl
                        }, 2000);
                    }
                } else if (updatedRole.oldRole == undefined) {
                    $rootScope.notifySuccess($rootScope.message('is.user.role.added.project') + ' ' + updatedProject.name);
                    if (self.workspace.class == 'Project' && updatedProject.id == self.workspace.id) {
                        self.reload();
                    }
                } else {
                    $rootScope.notifySuccess($rootScope.message('is.user.role.updated.project') + ' ' + updatedProject.name);
                    if (self.workspace.class == 'Project' && updatedProject.id == self.workspace.id) {
                        self.reload();
                    }
                }
            }
        });
    };
    this.bo = function() {
        return self.roles.businessOwner;
    };
    this.psh = function() {
        return self.roles.portfolioStakeHolder;
    };
    this.poOrSm = function() {
        return self.roles.productOwner || self.roles.scrumMaster;
    };
    this.po = function() {
        return self.roles.productOwner;
    };
    this.sm = function() {
        return self.roles.scrumMaster;
    };
    this.admin = function() {
        return self.roles.admin;
    };
    this.authenticated = function() {
        return !_.isEmpty(self.user);
    };
    this.inProject = function() {
        return self.roles.productOwner || self.roles.scrumMaster || self.roles.teamMember;
    };
    this.stakeHolder = function() {
        return self.roles.stakeHolder;
    };
    this.tm = function() {
        return self.roles.teamMember;
    };
    this.tmOrSm = function() {
        return self.roles.scrumMaster || self.roles.teamMember;
    };
    this.creator = function(item) {
        return this.authenticated && !_.isEmpty(item) && !_.isEmpty(item.creator) && self.user.id == item.creator.id;
    };
    this.responsible = function(item) {
        return this.authenticated && !_.isEmpty(item) && !_.isEmpty(item.responsible) && self.user.id == item.responsible.id;
    };
    this.owner = function(item) {
        return !_.isEmpty(item) && !_.isEmpty(item.owner) && (self.user.id == item.owner.id || self.admin());
    };
    this.current = function(user) {
        return self.authenticated() && user && self.user.id == user.id;
    };
    this.getWorkspace = function() {
        return self.workspace;
    };
    this.getLanguages = function() {
        return FormService.httpGet('scrumOS/languages', {cache: true}, true);
    };
    this.getTimezones = function() {
        return FormService.httpGet('scrumOS/timezones', {cache: true}, true);
    };
    this.workspacesListByUser = function(params) {
        if (!params) {
            params = {};
        }
        params.paginate = true;
        return FormService.httpGet('scrumOS/workspacesListByUser', {params: params}, true).then(function(data) {
            if (!params.light) {
                var Project = $injector.get('Project');
                var ProjectService = $injector.get('ProjectService');
                _.each(data.projects, function(project) {
                    _.merge(project, new Project());
                });
                data.projects = ProjectService.mergeProjects(data.projects);
                var Portfolio = $injector.get('Portfolio');
                var PortfolioService = $injector.get('PortfolioService');
                _.each(data.portfolios, function(portfolio) {
                    _.merge(portfolio, new Portfolio());
                });
                PortfolioService.mergePortfolios(data.portfolios);
            }
            return data;
        });
    };
}]);

services.service('FormService', ['$filter', '$http', '$rootScope', '$timeout', '$q', 'DomainConfigService', function($filter, $http, $rootScope, $timeout, $q, DomainConfigService) {
    var self = this;
    this.previous = function(itemList, item) {
        var itemIndex = _.findIndex(itemList, {id: item.id});
        return itemIndex > 0 ? itemList[itemIndex - 1] : null;
    };
    this.next = function(itemList, item) {
        var itemIndex = _.findIndex(itemList, {id: item.id});
        return itemIndex + 1 <= itemList.length ? itemList[itemIndex + 1] : null;
    };
    this.previousOrNext = function(isPreviousOrNext, itemList, item) {
        var previousOrNext;
        if (itemList && itemList.length && _.find(itemList, {id: item.id})) {
            previousOrNext = {
                previousOrNext: isPreviousOrNext === 'previous' ? self.previous(itemList, item) : self.next(itemList, item)
            };
        }
        return previousOrNext;
    };
    this.formObjectData = function(obj, prefix) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i, _prefix;
        _prefix = prefix ? prefix : (obj['class'] ? obj['class'] + '.' : '');
        _prefix = _.lowerFirst(_prefix);
        for (name in obj) {
            value = obj[name];
            if (value instanceof Array) {
                var pair = _.takeRight(_.filter((_prefix + name).split('.'), _.identity), 2);
                var context = pair[0];
                var property = pair[1];
                if (DomainConfigService.config[context] && _.includes(DomainConfigService.config[context].array, property)) {
                    if (value.length == 0) {
                        query += encodeURIComponent(_prefix + name) + '=&';
                    } else {
                        for (i = 0; i < value.length; ++i) {
                            subValue = value[i];
                            innerObj = {};
                            innerObj[name] = subValue;
                            query += self.formObjectData(innerObj, _prefix) + '&';
                        }
                    }
                }
            } else if (value instanceof Date) {
                var encodedDate = $filter('dateToIso')(value);
                query += encodeURIComponent(_prefix + name) + '=' + encodeURIComponent(encodedDate) + '&';
            } else if (value instanceof Object) {
                for (subName in value) {
                    if ((subName !== 'class' || name === 'commentable') && !_.startsWith(subName, '$')) { // Commentable special case instead of removing  "!= 'class'" by fear of breaking everything
                        subValue = value[subName];
                        fullSubName = name + '.' + subName;
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        var innerObjString = self.formObjectData(innerObj, _prefix);
                        if (innerObjString) {
                            query += innerObjString + '&';
                        }
                    }
                }
            } else if (value === undefined) {
                query += encodeURIComponent(_prefix + name) + '=null&'; // HACK: an undefined property (e.g. select cleared makes the model undefined) set the null value in Grails data binding
            } else if (value !== null
                       // No class info needed
                       && !_.includes(['class', 'uid', 'lastUpdated', 'dateCreated'], name)
                       // No angular object
                       && !_.startsWith(name, '$')
                       // No custom count / html values
                       && !_.endsWith(name, '_count') && !_.endsWith(name, '_html')) {
                query += encodeURIComponent(_prefix + name) + '=' + encodeURIComponent(value) + '&';
            }
        }
        return query.length ? query.substr(0, query.length - 1) : query;
    };
    this.httpNetIsReachable = function(params) {
        var paramObj = params || {};
        if (!paramObj.headers) {
            paramObj.headers = {};
        }
        paramObj.headers['x-icescrum-client'] = 'webclient';
        return $http.get('https://www.icescrum.com/check.php?rand=' + Date.now(), paramObj).then(function(response) {
            return response.status === 200;
        }).catch(function() {
            return false;
        });
    };
    this.httpGet = function(path, params, isAbsolute) {
        var fullPath = isAbsolute ? $rootScope.serverUrl + '/' + path : path;
        var paramObj = params || {};
        if (!paramObj.headers) {
            paramObj.headers = {};
        }
        paramObj.headers['x-icescrum-client'] = 'webclient';
        if (isSettings.enableProfiler) {
            paramObj.headers['x-icescrum-profiler'] = 'true';
        }
        return $http.get(fullPath, paramObj).then(function(response) {
            return response.data;
        });
    };
    this.httpDelete = function(path, params, isAbsolute) {
        var fullPath = isAbsolute ? $rootScope.serverUrl + '/' + path : path;
        var paramObj = params || {};
        if (!paramObj.headers) {
            paramObj.headers = {};
        }
        paramObj.headers['x-icescrum-client'] = 'webclient';
        if (isSettings.enableProfiler) {
            paramObj.headers['x-icescrum-profiler'] = 'true';
        }
        return $http.delete(fullPath, paramObj).then(function(response) {
            return response.data;
        });
    };
    this.httpPost = function(path, data, isAbsolute, params) {
        var fullPath = isAbsolute ? $rootScope.serverUrl + '/' + path : path;
        var paramObj = params || {
            headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
            transformRequest: function(data) {
                return self.formObjectData(data, '');
            }
        };
        if (!paramObj.headers) {
            paramObj.headers = {};
        }
        paramObj.headers['x-icescrum-client'] = 'webclient';
        if (isSettings.enableProfiler) {
            paramObj.headers['x-icescrum-profiler'] = 'true';
        }
        return $http.post(fullPath, data, paramObj).then(function(response) {
            return response.data;
        });
    };
    this.addStateChangeDirtyFormListener = function($scope, submit, type, isModal, anyStateChange) {
        var triggerChangesConfirmModal = function(event, saveChangesCallback, dontSaveChangesCallback) {
            if ($scope.isDirty() || ($scope.flow != undefined && $scope.flow.isUploading())) {
                event.preventDefault(); // cancel the state change
                $scope.mustConfirmStateChange = false;
                $scope.dirtyChangesConfirm({
                    message: $scope.message('todo.is.ui.dirty.confirm'),
                    saveChangesCallback: function() {
                        var result = submit();
                        if (result) {
                            result.then(saveChangesCallback);
                        } else {
                            saveChangesCallback();
                        }
                    },
                    dontSaveChangesCallback: function() {
                        if ($scope.flow != undefined && $scope.flow.isUploading()) {
                            $scope.flow.cancel();
                        }
                        dontSaveChangesCallback();
                    },
                    cancelChangesCallback: function() {
                        $scope.uiReady(true);
                        $scope.mustConfirmStateChange = true;
                    }
                });
            }
        };
        $scope.mustConfirmStateChange = true; // to prevent infinite recursion when calling $stage.go
        $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            var formDirtyType = $scope.stateIdProp ? $scope.stateIdProp : type + 'Id';
            if ($scope.mustConfirmStateChange && (anyStateChange || fromParams[formDirtyType] != toParams[formDirtyType])) {
                var callback = function() {
                    $scope.$state.go(toState, toParams);
                };
                triggerChangesConfirmModal(event, callback, callback);
            }
        });
        if (isModal) {
            $scope.$on('modal.closing', function(event) {
                if ($scope.mustConfirmStateChange) {
                    var callback = function() {
                        $scope.$close();
                    };
                    triggerChangesConfirmModal(event, callback, callback);
                }
            });
        }
    };
    this.transformStringToDate = function(item) {
        _.each(['startDate', 'endDate', 'inProgressDate', 'doneDate', 'eventDate', 'date'], function(dateName) {
            if (item.hasOwnProperty(dateName) && item[dateName] != null) {
                item[dateName] = new Date(item[dateName]);
            }
        });
    };
    this.copyToClipboard = function(text) {
        return $q(function(resolve, reject) { // No need to be asynchronous but more elegand with promise API for success / reject
            if (!document.queryCommandSupported || !document.queryCommandSupported('copy')) {
                console.error('Error - Copy to clipboard not supported on your browser');
                reject(text);
            }
            var tempElement = document.createElement('textarea');
            _.merge(tempElement.style, {
                fontSize: '12pt',
                border: '0',
                padding: '0',
                margin: '0',
                position: 'absolute',
                left: '-9999px',
                top: (window.pageYOffset || document.documentElement.scrollTop) + 'px'
            });
            tempElement.setAttribute('readonly', '');
            tempElement.value = text;
            document.body.appendChild(tempElement);
            try {
                tempElement.select();
                tempElement.setSelectionRange(0, tempElement.value.length);
                document.execCommand('copy');
                resolve(text);
            } catch (exception) {
                console.error('Error - Copy to clipboard value: ' + text + ' exception: ' + exception);
                reject(text);
            } finally {
                document.body.removeChild(tempElement);
            }
        });
    }
}]);

services.service('I18nService', [function() {
    var self = this;
    // Bundles (already translated)
    this.bundles = {};
    this.initBundles = function(bundles) {
        self.bundles = bundles;
    };
    this.getBundle = function(bundleName) {
        return this.bundles[bundleName];
    };
    // Messages
    this.messages = {};
    this.initMessages = function(messages) {
        self.messages = messages;
    };
    this.message = function(code, args, defaultCode) {
        var text = self.messages[code] ? self.messages[code] : (defaultCode && self.messages[defaultCode] ? self.messages[defaultCode] : code);
        angular.forEach(args, function(arg, index) {
            var placeholderMatcher = new RegExp('\\{' + index + '\\}', 'g');
            text = text.replace(placeholderMatcher, arg);
        });
        return text;
    };
}]);

services.service('CacheService', ['$injector', function($injector) {
    var self = this;
    var caches = {};
    this.cacheCreationDates = {};
    this.getCache = function(cacheName) {
        if (!_.isString(cacheName)) {
            throw Error("This cache name is not a string: " + cacheName);
        }
        if (!_.isArray(caches[cacheName])) {
            caches[cacheName] = [];
            self.cacheCreationDates[cacheName] = new Date()
        }
        return caches[cacheName];
    };
    this.emptyCache = function(cacheName) {
        var cache = self.getCache(cacheName);
        _.each(_.map(cache, 'id'), function(cacheId) { // Can't do the each directly on cache because it is mutated by the remove
            self.remove(cacheName, cacheId);
        });
        cache.splice(0, cache.length);
    };
    this.emptyCachesExcept = function(excludes) {
        _.each(_.keys(caches), function(cacheName) {
            if (!_.includes(excludes, cacheName)) {
                self.emptyCache(cacheName);
            }
        });
    };
    this.addOrUpdate = function(cacheName, itemFromServer) {
        var cachedItem = self.get(cacheName, itemFromServer.id);
        var oldItem = _.cloneDeep(cachedItem);
        var newItem;
        if (cachedItem) {
            _.assign(cachedItem, itemFromServer); // Not recursive
            newItem = cachedItem;
        } else {
            newItem = itemFromServer;
        }
        var isAllowed = $injector.get('OptionsCacheService').isAllowed(cacheName, newItem);
        if (isAllowed) {
            $injector.get('SyncService').sync(cacheName, oldItem, newItem);
        }
        if (!isAllowed) {
            self.remove(cacheName, itemFromServer.id);
        } else if (!oldItem && newItem && !newItem.messageId) {
            self.getCache(cacheName).push(newItem);
        }
        return newItem;
    };
    this.get = function(cacheName, id) {
        return _.find(self.getCache(cacheName), {id: angular.isNumber(id) ? parseInt(id) : id});
    };
    this.remove = function(cacheName, id) {
        var cachedItem = self.get(cacheName, id);
        if (cachedItem) {
            $injector.get('SyncService').sync(cacheName, cachedItem, null);
            _.remove(self.getCache(cacheName), {id: angular.isNumber(id) ? parseInt(id) : id});
        }
    };
}]);

services.service('SyncService', ['$rootScope', '$injector', 'CacheService', 'workspaceCacheConfigs', 'Team', function($rootScope, $injector, CacheService, workspaceCacheConfigs, Team) { // Avoid injecting business service directly, use $injector instead in order to avoid circular references
    var sortByRank = function(obj1, obj2) {
        return obj1.rank - obj2.rank;
    };
    var syncFunctions = {
        portfolio: function(oldPortfolio, newPortfolio) {
            if (newPortfolio && !oldPortfolio) {
                _.each(workspaceCacheConfigs.portfolio, function(portfolioCache) {
                    newPortfolio[portfolioCache.arrayName] = []; // Init to empty to allow binding to a reference and automatically get the update
                });
            }
        },
        project: function(oldProject, newProject) {
            if (newProject && !oldProject) {
                _.each(workspaceCacheConfigs.project, function(projectCache) {
                    newProject[projectCache.arrayName] = []; // Init to empty to allow binding to a reference and automatically get the update
                });
                newProject.team = new Team(newProject.team);
                CacheService.addOrUpdate('team', newProject.team);
            }
        },
        story: function(oldStory, newStory) {
            var oldSprintId = (oldStory && oldStory.parentSprint) ? oldStory.parentSprint.id : null;
            var newSprintId = (newStory && newStory.parentSprint) ? newStory.parentSprint.id : null;
            if (newSprintId != oldSprintId) {
                if (oldSprintId) {
                    var cachedSprint = CacheService.get('sprint', oldSprintId);
                    if (cachedSprint) {
                        _.remove(cachedSprint.stories, {id: oldStory.id});
                        if (_.isArray(cachedSprint.stories)) {
                            cachedSprint.stories.sort(sortByRank);
                            cachedSprint.stories_count = cachedSprint.stories.length;
                        }
                    }
                }
                if (newSprintId) {
                    var cachedSprint = CacheService.get('sprint', newSprintId);
                    if (cachedSprint) {
                        if (!_.find(cachedSprint.stories, {id: newStory.id}) && !newStory.messageId) {
                            if (!_.isArray(cachedSprint.stories)) {
                                cachedSprint.stories = [];
                            }
                            cachedSprint.stories.push(newStory);
                        }
                        if (cachedSprint.stories) {
                            cachedSprint.stories.sort(sortByRank);
                        }
                    }
                }
            } else if (newSprintId && oldStory.rank != newStory.rank) {
                var cachedSprint = CacheService.get('sprint', newSprintId);
                if (cachedSprint && cachedSprint.stories) {
                    cachedSprint.stories.sort(sortByRank);
                }
            }
            var oldFeatureId = (oldStory && oldStory.feature) ? oldStory.feature.id : null;
            var newFeatureId = (newStory && newStory.feature) ? newStory.feature.id : null;
            if (newFeatureId != oldFeatureId) {
                if (oldFeatureId) {
                    var cachedFeature = CacheService.get('feature', oldFeatureId);
                    if (cachedFeature) {
                        _.remove(cachedFeature.stories, {id: oldStory.id});
                        if (_.isArray(cachedFeature.stories)) {
                            cachedFeature.stories_count = cachedFeature.stories.length;
                        }
                    }
                }
                if (newFeatureId) {
                    var cachedFeature = CacheService.get('feature', newFeatureId);
                    if (cachedFeature && !_.find(cachedFeature.stories, {id: newStory.id}) && !newStory.messageId) {
                        if (!_.isArray(cachedFeature.stories)) {
                            cachedFeature.stories = [];
                        }
                        cachedFeature.stories.push(newStory);
                    }
                }
            }
            var cachedProject;
            if (newStory && newStory.backlog || oldStory && oldStory.backlog) { // Not present when push only rank
                cachedProject = CacheService.get('project', newStory ? newStory.backlog.id : oldStory.backlog.id);
            }
            if (cachedProject) {
                var cachedBacklogs = cachedProject.backlogs;
                if (cachedBacklogs.length) {
                    var oldBacklogIds = [], newBacklogsIds = [];
                    var BacklogService = $injector.get('BacklogService');
                    _.each(cachedBacklogs, function(cachedBacklog) {
                        if (oldStory && BacklogService.filterStories(cachedBacklog, [oldStory]).length) {
                            oldBacklogIds.push(cachedBacklog.id);
                        }
                        if (newStory && BacklogService.filterStories(cachedBacklog, [newStory]).length) {
                            newBacklogsIds.push(cachedBacklog.id);
                        }
                    });
                    var backlogGetter = _.curry(CacheService.get)('backlog');
                    var backlogsToIncrement = _.map(_.difference(newBacklogsIds, oldBacklogIds), backlogGetter);
                    var backlogsToDecrement = _.map(_.difference(oldBacklogIds, newBacklogsIds), backlogGetter);
                    var backlogCacheDate = CacheService.cacheCreationDates['backlog'];
                    if ((!newStory || new Date(newStory.dateCreated) > backlogCacheDate || new Date(newStory.lastUpdated) > backlogCacheDate)) {
                        _.each(backlogsToIncrement, function(backlog) { backlog['count']++ });
                        _.each(backlogsToDecrement, function(backlog) { backlog['count']-- });
                    }
                    var backlogsToRank = [];
                    if (oldStory && newStory && oldStory.rank != newStory.rank) {
                        backlogsToRank = _.map(newBacklogsIds, backlogGetter);
                    }
                    var updatedBacklogCodes = _.uniq(_.map(_.union(backlogsToDecrement, backlogsToIncrement, backlogsToRank), 'code'));
                    if (updatedBacklogCodes) {
                        $rootScope.$broadcast('is:backlogsUpdated', updatedBacklogCodes);
                    }
                }
            }
        },
        task: function(oldTask, newTask) {
            var oldSprintId = (oldTask && oldTask.backlog) ? oldTask.backlog.id : null;
            var newSprintId = (newTask && newTask.backlog) ? newTask.backlog.id : null;
            if (newSprintId != oldSprintId) {
                if (oldSprintId) {
                    var cachedSprint = CacheService.get('sprint', oldSprintId);
                    if (cachedSprint) {
                        _.remove(cachedSprint.tasks, {id: oldTask.id});
                    }
                }
                if (newSprintId) {
                    var cachedSprint = CacheService.get('sprint', newSprintId);
                    if (cachedSprint && !_.find(cachedSprint.tasks, {id: newTask.id}) && !newTask.messageId) {
                        if (!_.isArray(cachedSprint.tasks)) {
                            cachedSprint.tasks = [];
                        }
                        cachedSprint.tasks.push(newTask);
                    }
                }
            }
            var oldStoryId = (oldTask && oldTask.parentStory) ? oldTask.parentStory.id : null;
            var newStoryId = (newTask && newTask.parentStory) ? newTask.parentStory.id : null;
            if (newStoryId != oldStoryId) {
                if (oldStoryId) {
                    var cachedStory = CacheService.get('story', oldStoryId);
                    if (cachedStory) {
                        _.remove(cachedStory.tasks, {id: oldTask.id});
                    }
                }
                if (newStoryId) {
                    var cachedStory = CacheService.get('story', newStoryId);
                    if (cachedStory && !_.find(cachedStory.tasks, {id: newTask.id}) && !newTask.messageId) {
                        if (!_.isArray(cachedStory.tasks)) {
                            cachedStory.tasks = [];
                        }
                        cachedStory.tasks.push(newTask);
                    }
                }
            }
        },
        feature: function(oldFeature, newFeature) {
            var cachedProject = CacheService.get('project', newFeature ? _.get(newFeature, 'backlog.id') : _.get(oldFeature, 'backlog.id'));
            if (cachedProject) {
                // Project
                if (oldFeature && newFeature && oldFeature.rank != newFeature.rank) {
                    cachedProject.features.sort(sortByRank);
                }
                var featureId = newFeature ? newFeature.id : oldFeature.id;
                _.each(cachedProject.stories, function(story) {
                    if (story.feature && story.feature.id == featureId) {
                        if (newFeature) {
                            story.feature.color = newFeature.color;
                            story.feature.name = newFeature.name;
                        } else {
                            story.feature = null;
                        }
                    }
                });
            } else {
                // TODO REMOVE WHEN PFV2
                var cachedPortfolio = CacheService.get('portfolio', newFeature ? _.get(newFeature, 'portfolio.id') : _.get(oldFeature, 'portfolio.id'));
                if (cachedPortfolio) {
                    if (oldFeature && newFeature && oldFeature.rank != newFeature.rank) {
                        cachedPortfolio.features.sort(sortByRank);
                    }
                }
            }
        },
        sprint: function(oldSprint, newSprint) {
            if (!oldSprint && newSprint) {
                var cachedRelease = CacheService.get('release', newSprint.parentRelease.id);
                if (cachedRelease && !_.find(cachedRelease.sprints, {id: newSprint.id}) && !newSprint.messageId) {
                    if (!_.isArray(cachedRelease.sprints)) {
                        cachedRelease.sprints = [];
                    }
                    cachedRelease.sprints.push(newSprint);
                }
            } else if (oldSprint && !newSprint) {
                var cachedRelease = CacheService.get('release', oldSprint.parentRelease.id);
                if (cachedRelease) {
                    _.remove(cachedRelease.sprints, {id: oldSprint.id});
                }
            }
        },
        release: function(oldRelease, newRelease) {
            if (oldRelease && newRelease && oldRelease.firstSprintIndex != newRelease.firstSprintIndex && newRelease.sprints) {
                _.each(newRelease.sprints, function(sprint) {
                    sprint.index = newRelease.firstSprintIndex + sprint.orderNumber - 1;
                });
            }
        },
        acceptanceTest: function(oldAcceptanceTest, newAcceptanceTest) {
            if (oldAcceptanceTest && newAcceptanceTest && oldAcceptanceTest.rank != newAcceptanceTest.rank) {
                var cachedStory = CacheService.get('story', oldAcceptanceTest.parentStory.id);
                cachedStory.acceptanceTests.sort(sortByRank);
            }
            if (!oldAcceptanceTest && newAcceptanceTest) {
                var cachedStory = CacheService.get('story', newAcceptanceTest.parentStory.id);
                if (cachedStory) {
                    if (!_.find(cachedStory.acceptanceTests, {id: newAcceptanceTest.id}) && !newAcceptanceTest.messageId) {
                        if (!_.isArray(cachedStory.acceptanceTests)) {
                            cachedStory.acceptanceTests = [];
                        }
                        cachedStory.acceptanceTests.push(newAcceptanceTest);
                    }
                    if (cachedStory.acceptanceTests) {
                        cachedStory.acceptanceTests.sort(sortByRank);
                    }
                }
            } else if (oldAcceptanceTest && !newAcceptanceTest) {
                var cachedStory = CacheService.get('story', oldAcceptanceTest.parentStory.id);
                if (cachedStory) {
                    _.remove(cachedStory.acceptanceTests, {id: oldAcceptanceTest.id});
                }
            }
        },
        comment: function(oldComment, newComment) {
            if (!oldComment && newComment) {
                var cachedCommentable = CacheService.get(newComment.commentable.class.toLowerCase(), newComment.commentable.id);
                if (cachedCommentable && !_.find(cachedCommentable.comments, {id: newComment.id}) && !newComment.messageId) {
                    if (!_.isArray(cachedCommentable.comments)) {
                        cachedCommentable.comments = [];
                    }
                    cachedCommentable.comments.push(newComment);
                }
            } else if (oldComment && !newComment) {
                var cachedCommentable = CacheService.get(oldComment.commentable.class.toLowerCase(), oldComment.commentable.id);
                if (cachedCommentable) {
                    _.remove(cachedCommentable.comments, {id: oldComment.id});
                }
            }
        }
    };
    this.sync = function(itemType, oldItem, newItem) {
        _.each(workspaceCacheConfigs, function(cacheConfigs, workspaceType) {
            var cacheConfig = cacheConfigs[itemType];
            if (cacheConfig) {
                var workspacePath = cacheConfig.workspacePath + '.id';
                if (!oldItem && newItem) {
                    var cachedProject = CacheService.get(workspaceType, _.get(newItem, workspacePath));
                    if (cachedProject && !_.find(cachedProject[cacheConfig.arrayName], {id: newItem.id}) && !newItem.messageId) {
                        cachedProject[cacheConfig.arrayName].push(newItem);
                        if (cacheConfig.sort && cacheConfig.sort === 'rank') {
                            cachedProject[cacheConfig.arrayName].sort(sortByRank);
                        }
                    }
                } else if (oldItem && !newItem) {
                    var cachedProject = CacheService.get(workspaceType, _.get(oldItem, workspacePath));
                    if (cachedProject) {
                        _.remove(cachedProject[cacheConfig.arrayName], {id: oldItem.id});
                        if (cacheConfig.sort && cacheConfig.sort === 'rank') {
                            cachedProject[cacheConfig.arrayName].sort(sortByRank);
                        }
                    }
                }
            }
        });
        if (angular.isDefined(syncFunctions[itemType])) {
            syncFunctions[itemType](oldItem, newItem);
        }
    }
}]);

var restResource = angular.module('restResource', ['ngResource']);
restResource.factory('Resource', ['$resource', '$rootScope', '$q', 'FormService', function($resource, $rootScope, $q, FormService) {
    return function(url, params, methods) {
        var defaultParams = {
            id: '@id'
        };
        var getInterceptor = function(isArray) {
            return {
                response: function(response) {
                    if (isArray) {
                        _.each(response.resource, FormService.transformStringToDate);
                    } else {
                        FormService.transformStringToDate(response.resource);
                    }
                    return response.resource; // Required to mimic default interceptor
                }
            };
        };
        var transformRequest = function(data) {
            return angular.isObject(data) && String(data) !== '[object File]' ? FormService.formObjectData(data) : data;
        };
        var transformQueryParams = function(resolve) { // Magical hack found here: http://stackoverflow.com/questions/24082468/how-to-intercept-resource-requests
            var originalParamSerializer = this.paramSerializer;
            this.paramSerializer = function(params) {
                var isDeepObject = _.isObject(params) && _.some(_.values(params), _.isObject);
                return isDeepObject ? FormService.formObjectData(params) : originalParamSerializer(params);
            };
            this.then = null;
            resolve(this);
        };
        var defaultHeaders = {'x-icescrum-client': 'webclient'};
        if (isSettings.enableProfiler) {
            defaultHeaders['x-icescrum-profiler'] = 'true';
        }
        var defaultPostHeaders = _.assign({}, defaultHeaders, {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'});
        var defaultMethods = {
            save: {
                method: 'post',
                isArray: false,
                headers: _.clone(defaultPostHeaders),
                transformRequest: transformRequest,
                interceptor: getInterceptor(false)
            },
            saveArray: {
                method: 'post',
                isArray: true,
                headers: _.clone(defaultPostHeaders),
                transformRequest: transformRequest,
                interceptor: getInterceptor(true)
            },
            get: {
                method: 'get',
                interceptor: getInterceptor(false),
                headers: _.clone(defaultHeaders),
                then: transformQueryParams
            },
            query: {
                method: 'get',
                isArray: true,
                headers: _.clone(defaultHeaders),
                interceptor: getInterceptor(true),
                then: transformQueryParams
            },
            delete: {
                method: 'delete',
                headers: _.clone(defaultHeaders)
            },
            deleteArray: {
                method: 'delete',
                headers: _.clone(defaultHeaders),
                isArray: true
            }
        };
        defaultMethods.update = angular.copy(defaultMethods.save); // for the moment there is no difference between save & update
        defaultMethods.updateArray = angular.copy(defaultMethods.saveArray); // for the moment there is no difference between save & update
        if (url.indexOf('/') == 0) {
            url = isSettings.serverUrl + url;
        }
        _.each(methods, function(method) {
            method.transformRequest = transformRequest;
            method.then = transformQueryParams;
            method.headers = method.method.toLowerCase() === 'post' ? _.clone(defaultPostHeaders) : _.clone(defaultHeaders);
            if (method.url && method.url.indexOf('/') == 0) {
                method.url = isSettings.serverUrl + method.url;
            }
        });
        return $resource(url, angular.extend(defaultParams, params), angular.extend(defaultMethods, methods));
    };
}]);

services.service("DateService", [function() {
    var self = this;
    this.immutableAddDaysToDate = function(date, days) {
        return moment(date).utc().add(days, 'days').toDate(); // POC using moment instead of custom management
    };
    this.immutableAddMonthsToDate = function(date, months) {
        var newDate = new Date(date);
        newDate.setMonth(date.getMonth() + months);
        return newDate;
    };
    this.getMidnightUTC = function(date) { // Be careful, it may not do what you expect!
        var newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0); // Midnight
        newDate.setMinutes(-newDate.getTimezoneOffset()); // UTC
        return newDate;
    };
    this.getMidnightTodayUTC = function() {
        var today = new Date();
        today.setHours(0, 0, 0, 0); // Midnight
        today.setMinutes(-today.getTimezoneOffset()); // UTC
        return today;
    };
    this.daysBetweenDates = function(startDate, endDate) {
        var duration = new Date(endDate) - new Date(startDate); // Ensure that we have dates
        return Math.floor(duration / (1000 * 3600 * 24));
    };
    this.daysBetweenDays = function(firstDay, lastDay) {
        return self.daysBetweenDates(firstDay, lastDay) + 1; // e.g. from 14/05 to 15/05 it is two days of work, whereas it is only one day in dates
    };
    this.isToday = function(date) { // Assumes that date is at midnight UTC (e.g. 4:00 at timezone +4)
        return date.getTime() === self.getMidnightTodayUTC().getTime();
    };
    this.isWeekend = function(date) {
        var testDate = new Date(date);
        testDate.setTime(testDate.getTime() + date.getTimezoneOffset() * 60 * 1000); // Cancel the timezone shift in order be sure to be the right day of week
        return testDate.getDay() % 6 === 0;
    };
}]);

services.service("OptionsCacheService", ['$rootScope', 'CacheService', function($rootScope, CacheService) {
    var options = {
        feature: {
            isAllowed: function(item) {
                if ($rootScope.application.context && $rootScope.application.context.type == 'tag') {
                    return _.some(item.tags, function(tag) {
                        return $rootScope.application.context.term.toLowerCase() === tag.toLowerCase();
                    });
                }
                return true;
            }
        },
        story: {
            isAllowed: function(item) {
                if ($rootScope.application.context) {
                    if ($rootScope.application.context.type == 'feature') {
                        return item.feature && item.feature.id == $rootScope.application.context.id;
                    } else if ($rootScope.application.context.type == 'actor') {
                        var ids = _.map(item.actors_ids, 'id');
                        return _.includes(ids, parseInt($rootScope.application.context.id));
                    } else if ($rootScope.application.context.type == 'tag') {
                        return _.some(item.tags, function(tag) {
                            return $rootScope.application.context.term.toLowerCase() == tag.toLowerCase();
                        });
                    } else {
                        return false;
                    }
                }
                return true;
            }
        },
        task: {
            isAllowed: function(item) {
                if ($rootScope.application.context && item.parentStory) {
                    var cachedStory = CacheService.get('story', item.parentStory.id);
                    if ($rootScope.application.context.type == 'feature') {
                        return cachedStory && cachedStory.feature.id == $rootScope.application.context.id;
                    } else if ($rootScope.application.context.type == 'actor') {
                        if (cachedStory) {
                            var ids = _.map(cachedStory.actors_ids, 'id');
                            return _.includes(ids, parseInt($rootScope.application.context.id));
                        } else {
                            return false;
                        }
                    }
                }
                return true;
            }
        }
    };
    this.getOptions = function() {
        return options;
    };
    this.isAllowed = function(cacheName, item) {
        return options[cacheName] && options[cacheName].hasOwnProperty('isAllowed') ? options[cacheName].isAllowed(item) : true;
    };
}]);

services.service("DomainConfigService", [function() {
    this.config = {
        availability: {
            array: ['days']
        },
        feature: {
            array: ['tags']
        },
        story: {
            array: ['tags']
        },
        task: {
            array: ['tags']
        },
        project: {
            array: ['productOwners', 'stakeHolders', 'invitedStakeHolders', 'invitedProductOwners']
        },
        portfolio: {
            array: ['projects', 'stakeHolders', 'invitedStakeHolders', 'businessOwners', 'invitedBusinessOwners']
        },
        team: {
            array: ['members', 'scrumMasters', 'invitedMembers', 'invitedScrumMasters']
        },
        emailsSettings: {
            array: ['autoFollow', 'onUrgentTask', 'onStory']
        },
        hook: {
            array: ['events']
        }
    };
    this.config.projectd = this.config.project;
    this.config.portfoliod = this.config.portfolio;
}]);

services.service('ContextService', ['$location', '$q', '$injector', 'TagService', 'ActorService', 'FeatureService', 'WorkspaceType', 'contextDecorators', function($location, $q, $injector, TagService, ActorService, FeatureService, WorkspaceType, contextDecorators) {
    var self = this;
    this.contextSeparator = '_';
    this.getContextFromUrl = function() {
        var contextParam = $location.search().context;
        if (contextParam === true || !contextParam || contextParam.indexOf(self.contextSeparator) == -1) {
            return null;
        } else {
            var contextFields = contextParam.split(self.contextSeparator);
            return {type: contextFields[0], id: contextFields.slice(1).join(self.contextSeparator)};
        }
    };
    this.contexts = [];
    this.loadContexts = function() {
        var Session = $injector.get('Session');
        if (Session.workspaceType === WorkspaceType.PROJECT) {
            var project = Session.workspace;
            return $q.all([TagService.getTags(), FeatureService.list(project), ActorService.list(project.id)]).then(function(data) {
                var tags = data[0];
                var features = data[1];
                var actors = data[2];
                var contexts = _.map(tags, function(tag) {
                    return {type: 'tag', id: tag, term: tag, color: 'purple'};
                });
                contexts = contexts.concat(_.map(features, function(feature) {
                    return {type: 'feature', id: feature.id.toString(), term: feature.name, color: feature.color};
                }));
                contexts = contexts.concat(_.map(actors, function(actor) {
                    return {type: 'actor', id: actor.id.toString(), term: actor.name, color: '#94d4b6'};
                }));
                var promise = $q.when();
                _.each(contextDecorators, function(contextDecorator) {
                    promise = promise.then(function() {
                        return contextDecorator(contexts, project, $injector);
                    });
                });
                return promise.then(function() {
                    self.contexts = contexts;
                    return contexts;
                });
            });
        } else if (Session.workspaceType === WorkspaceType.PORTFOLIO) {
            return TagService.getTags().then(function(tags) {
                var contexts = _.map(tags, function(tag) {
                    return {type: 'tag', id: tag, term: tag, color: 'purple'};
                });
                self.contexts = contexts;
                return contexts;
            });
        } else {
            return $q.when([])
        }
    };
    this.equalContexts = function(context1, context2) {
        return context1 == context2 || context1 && context2 && context1.type == context2.type && context1.id == context2.id;
    };
}]);

services.service('TagService', ['FormService', function(FormService) {
    this.getTags = function() {
        return FormService.httpGet('tag'); // Workspace sensitive
    }
}]);

services.service('ClientOauthService', ['FormService', '$auth', 'SatellizerConfig', function(FormService, $auth, SatellizerConfig) {
    var self = this;
    this.authenticate = function(providerId, options, autosave) {
        var data = {};
        if (options && options.baseUrl) {
            if (!SatellizerConfig.providers[providerId].defaultAuthorizationEndpoint) { //keep default
                SatellizerConfig.providers[providerId].defaultAuthorizationEndpoint = SatellizerConfig.providers[providerId].authorizationEndpoint;
            }
            SatellizerConfig.providers[providerId].authorizationEndpoint = options.baseUrl + SatellizerConfig.providers[providerId].defaultAuthorizationEndpoint; //put full authorization url
            data.baseTokenUrl = options.baseUrl;
        }
        if (options && options.clientId) {
            SatellizerConfig.providers[providerId].clientId = options.clientId;
            data.clientId = options.clientId;
        }
        return $auth.authenticate(providerId, data).then(function(response) {
            var result = {oauth: response.data};
            if (options) {
                result.oauth.baseUrl = options.baseUrl;
                result.oauth.clientId = options.clientId;
            }
            if (autosave) {
                return self.save(providerId, result).then(function(response) {
                    return response;
                });
            } else {
                return result;
            }
        });
    };
    this.save = function(providerId, tokenData) {
        return FormService.httpPost('clientOauth/' + providerId, tokenData); // Workspace sensitive
    };
    this.get = function(providerId) {
        return FormService.httpGet('clientOauth/' + providerId); // Workspace sensitive
    };
    this.delete = function(providerId) {
        return FormService.httpDelete('clientOauth/' + providerId); // Workspace sensitive
    };
    this.refresh = function(providerId) {
        return FormService.httpGet('clientOauth/' + providerId + '/refresh'); // Workspace sensitive
    }
}]);

services.service('stickyNoteSize', ['screenSize', '$localStorage', function(screenSize, $localStorage) {
    this.currentStickyNoteSize = function(viewName, defaultSize) {
        if (screenSize.is('xs, sm')) {
            return 'list-group';
        } else {
            var contextSizeName = viewName + 'PostitSize';
            if (defaultSize && !$localStorage[contextSizeName]) {
                $localStorage[contextSizeName] = defaultSize;
            }
            return $localStorage[contextSizeName];
        }
    };
    this.iconCurrentStickyNoteSize = function(viewName) {
        var icon;
        switch (this.currentStickyNoteSize(viewName)) {
            case 'list-group':
                icon = 'list-group';
                break;
            case 'grid-group size-sm':
                icon = 'grid-group-sm';
                break;
            default:
                icon = 'grid-group';
                break;
        }
        return icon;
    };
    this.setStickyNoteSize = function(viewName, postitSize) {
        $localStorage[viewName + 'PostitSize'] = postitSize;
    };
}]);

services.service('StoryTypesClasses', ['StoryTypesByName', function(StoryTypesByName) {
    this[StoryTypesByName.USER_STORY] = '';
    this[StoryTypesByName.DEFECT] = 'defect';
    this[StoryTypesByName.TECHNICAL_STORY] = 'technical';
}]);

services.service("ColorService", [function() {
    this.hexToRgb = function(hex) {
        var num = parseInt(hex.substring(1), 16);
        var r = (num >> 16) & 255;
        var g = (num >> 8) & 255;
        var b = num & 255;
        return [r, g, b];
    };
    this.rgbToHex = function(rgb) {
        var decimalToRgb = function(decimal) {
            var hex = decimal.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + decimalToRgb(rgb[0]) + decimalToRgb(rgb[1]) + decimalToRgb(rgb[2]);
    };
    this.rgbToHsl = function(rgb) {
        var r = rgb[0] / 255;
        var g = rgb[1] / 255;
        var b = rgb[2] / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var delta = max - min;
        var h;
        if (delta === 0) {
            h = 0;
        } else if (max === r) {
            h = (g - b) / delta % 6;
        } else if (max === g) {
            h = (b - r) / delta + 2;
        } else if (max === b) {
            h = (r - g) / delta + 4;
        }
        var l = (min + max) / 2;
        var s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        h = h * 60;
        if (h < 0) {
            h += 360;
        }
        return [h, s, l];
    };
    this.hslToRgb = function(h, s, l) {
        var c = (1 - Math.abs(2 * l - 1)) * s;
        var hp = h / 60.0;
        var x = c * (1 - Math.abs((hp % 2) - 1));
        var rgb1;
        if (isNaN(h)) {
            rgb1 = [0, 0, 0];
        } else if (hp <= 1) {
            rgb1 = [c, x, 0];
        } else if (hp <= 2) {
            rgb1 = [x, c, 0];
        } else if (hp <= 3) {
            rgb1 = [0, c, x];
        } else if (hp <= 4) {
            rgb1 = [0, x, c];
        } else if (hp <= 5) {
            rgb1 = [x, 0, c];
        } else if (hp <= 6) {
            rgb1 = [c, 0, x];
        }
        var m = l - c * 0.5;
        return [Math.round(255 * (rgb1[0] + m)), Math.round(255 * (rgb1[1] + m)), Math.round(255 * (rgb1[2] + m))];
    };
    this.normalizeH = function(originalH) { // H from HSL ranges from 0 to 359 as the value represents degrees on a circle
        if (originalH >= 360) {
            return originalH - 360;
        } else if (originalH < 0) {
            return originalH + 360;
        } else {
            return originalH;
        }
    };
    this.brightness = function(rgb) { // Luminance / Luma in YIQ
        return ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
    };
    this.rgbStringToRgb = function(rgbString) {
        return rgbString.replace(/^(rgb|rgba)\(/, '').replace(/\)$/, '').replace(/\s/g, '').split(',');
    };
}]);