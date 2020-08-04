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
 *
 */

var contrastColorCache = {}, gradientCache = {}, userVisualRolesCache = {};
var filters = angular.module('filters', []);

filters
    .filter('userNamesFromEmail', function() {
        return function(email) {
            var namesFromEmail = {email: email};
            var emailPrefix = email.split('@')[0];
            namesFromEmail.firstName = emailPrefix;
            namesFromEmail.username = emailPrefix;
            var dotPosition = emailPrefix.indexOf('.');
            if (dotPosition != -1) {
                namesFromEmail.firstName = _.capitalize(emailPrefix.substring(0, dotPosition));
                namesFromEmail.lastName = _.capitalize(emailPrefix.substring(dotPosition + 1));
            }
            return namesFromEmail;
        };
    })
    .filter('displayNames', function() {
        return function(users) {
            return _.chain(users).map(function(user) {
                return _.capitalize(user.firstName) + ' ' + _.upperCase(user.lastName.substring(0, 1)) + '.';
            }).join(', ').value();
        };
    })
    .filter('userFullName', ['$filter', function($filter) {
        return function(user) {
            var firstName = '';
            var lastName = '';
            if (user) {
                if (user.id) {
                    firstName = user.firstName;
                    lastName = user.lastName;
                } else if (user.email) {
                    var namesFromEmail = $filter('userNamesFromEmail')(user.email);
                    firstName = namesFromEmail.firstName;
                    lastName = namesFromEmail.lastName;
                }
            }
            return firstName + (lastName ? ' ' + lastName : '');
        };
    }])
    .filter('userAvatar', ['$rootScope', 'Session', function($rootScope, Session) {
        return function(user) {
            if (Session.current(user)) {
                user = Session.user; // Bind to current user to see avatar change immediately
            }
            return $rootScope.serverUrl + '/user' + (user && user.id ? ('/' + user.id) : '') + '/avatar';
        };
    }])
    .filter('userInitialsAvatar', ['$rootScope', 'FormService', function($rootScope, FormService) {
        return function(user) {
            return $rootScope.serverUrl + '/user/initialsAvatar/?firstName=' + user.firstName + '&lastName=' + user.lastName;
        };
    }])
    .filter('userColorRoles', ['$rootScope', 'Session', function($rootScope, Session) {
        return function(user, project) {
            var classes = "";
            if (!project) {
                project = $rootScope.getProjectFromState();
            }
            if (!project || !project.pkey || !user) {
                return classes;
            }
            if (!userVisualRolesCache[project.pkey]) {
                userVisualRolesCache[project.pkey] = {};
            }
            if (!userVisualRolesCache[project.pkey][user.id]) {
                if (_.find(project.productOwners, {id: user.id})) {
                    classes += " role-po";
                }
                if (_.find(project.team.scrumMasters, {id: user.id})) {
                    if (classes.indexOf('role-po') !== -1) {
                        classes += "-sm";
                    } else {
                        classes += " role-sm";
                    }
                }
                userVisualRolesCache[project.pkey][user.id] = classes;
            }
            var finalClasses = userVisualRolesCache[project.pkey][user.id];
            if (_.find(project.onlineMembers, {id: user.id})) {
                finalClasses += " user-online";
            }
            return finalClasses;
        };
    }])
    .filter('storyType', ['StoryTypesClasses', function(StoryTypesClasses) {
        return function(type) {
            var cssClass = StoryTypesClasses[type];
            if (cssClass) {
                cssClass += ' sticky-note-type';
            }
            return cssClass;
        };
    }])
    .filter('storyTypeIcon', ['StoryTypesClasses', function(StoryTypesClasses) {
        return function(type) {
            var clazz = StoryTypesClasses[type];
            return clazz ? ('item-type-icon item-type-icon-' + clazz) : '';
        }
    }])
    .filter('featureType', ['FeatureTypesByName', function(FeatureTypesByName) {
        return function(type) {
            return type == FeatureTypesByName.ENABLER ? 'enabler sticky-note-type' : '';
        };
    }])
    .filter('featureTypeIcon', ['FeatureTypesByName', function(FeatureTypesByName) {
        return function(type) {
            return type == FeatureTypesByName.ENABLER ? 'item-type-icon item-type-icon-enabler' : '';
        };
    }])
    .filter('featureNameState', ['FeatureStatesByName', 'i18nFilter', function(FeatureStatesByName, i18nFilter) {
        return function(feature) {
            return feature.name + (feature.state === FeatureStatesByName.DONE ? ' (' + i18nFilter(FeatureStatesByName.DONE, 'FeatureStates') + ')' : '');
        }
    }])
    .filter('join', function() {
        return function(array) {
            return _.join(array, ', ');
        };
    })
    .filter('storyColor', function() {
        return function(story) {
            return (story && story.feature) ? story.feature.color : '#f9f157';
        };
    })
    .filter('contrastColor', ['ColorService', function(ColorService) {
        return function(color) {
            if (color) {
                if (contrastColorCache[color] === undefined) {
                    var rgb = color.indexOf('#') === 0 ? ColorService.hexToRgb(color) : ColorService.rgbStringToRgb(color);
                    contrastColorCache[color] = ColorService.brightness(rgb) >= 169 ? '' : 'invert';
                }
                return contrastColorCache[color];
            } else {
                return '';
            }
        };
    }])
    .filter('gradientColor', ['ColorService', function(ColorService) {
        return function(originalHex) {
            if (!gradientCache[originalHex]) {
                // Shift the color hue by hOffset in one direction and if the color is darker try hOffset in the other direction
                var originalRgb = ColorService.hexToRgb(originalHex);
                var shiftH = function(originalH, targetS, targetL, hOffset) {
                    var targetH = originalH + hOffset;
                    targetH = ColorService.normalizeH(targetH);
                    var tempRgb = ColorService.hslToRgb(targetH, targetS, targetL);
                    if (ColorService.brightness(tempRgb) < ColorService.brightness(originalRgb)) {
                        targetH = originalH - hOffset;
                        targetH = ColorService.normalizeH(targetH);
                    }
                    return targetH;
                };
                var originalHsl = ColorService.rgbToHsl(originalRgb);
                // Target S
                var targetS = originalHsl[1];
                // Target L
                var lOffset = originalHex === '#ffcc01' ? 0.01 : 0.05; // Hack to preserve task yellow
                var targetL = originalHsl[2] + lOffset;
                if (targetL > 1) {
                    targetL = originalHsl[2] - lOffset;
                }
                // Target H
                var hOffset = 7;
                var targetH = shiftH(originalHsl[0], targetS, targetL, hOffset);
                // Target RGB
                var targetRgb = ColorService.hslToRgb(targetH, targetS, targetL);
                gradientCache[originalHex] = ColorService.rgbToHex(targetRgb);
            }
            return gradientCache[originalHex];
        };
    }])
    .filter('createGradientBackground', ['gradientColorFilter', function(gradientColorFilter) {
        return function(originalHex) {
            return {
                'background-image': 'linear-gradient(to top, ' + originalHex + ' 0%, ' + gradientColorFilter(originalHex) + ' 100%)'
            };
        };
    }])
    .filter('createShadow', ['ColorService', function(ColorService) {
        return function(originalHex) {
            var originalRgb = ColorService.hexToRgb(originalHex);
            return {
                'box-shadow': '0px 42px 48px 0px rgba(' + originalRgb[0] + ',' + originalRgb[1] + ',' + originalRgb[2] + ', 0.2)'
            };
        };
    }])
    .filter('actorTag', ['$state', 'ContextService', function($state, ContextService) {
        return function(description, actors) {
            var contextUrl = $state.href($state.current.name, $state.params);
            return description ? description.replace(/A\[(.+?)-(.+?)\]/g, function(actorTag, actorUid, actorName) {
                if (actors) {
                    var actorId = _.find(actors, {uid: parseInt(actorUid)}).id;
                    return '<a href="' + contextUrl + '?context=actor' + ContextService.contextSeparator + actorId + '">' + actorName + '</a>';
                } else {
                    return actorName;
                }
            }) : '';
        };
    }])
    .filter('i18n', ['I18nService', '$rootScope', function(I18nService, $rootScope) {
        return function(key, bundleName) {
            if (key != undefined && key != null) {
                var result;
                if (bundleName === 'StoryStates') {
                    var project = $rootScope.getProjectFromState();
                    if (project && project.storyStateNames) {
                        result = $rootScope.message(project.storyStateNames[key]);
                    }
                }
                if (!result && I18nService.getBundle(bundleName)) {
                    result = I18nService.getBundle(bundleName)[key];
                }
                return result;
            }
        }
    }])
    .filter('menuElementName', ['$rootScope', function($rootScope) {
        return function(menuElement, item) {
            if (menuElement) {
                return _.isFunction(menuElement.name) ? menuElement.name(item) : $rootScope.message(menuElement.name);
            }
        };
    }])
    .filter('lineReturns', function() {
        return function(text) {
            return text ? _.escape(text).replace(/\r\n/g, "<br/>").replace(/\n/g, '<br/>') : "";
        }
    })
    .filter('filesize', function() {
        return function(size) {
            var string;
            if (size >= 1024 * 1024 * 1024 * 1024 / 10) {
                size = size / (1024 * 1024 * 1024 * 1024 / 10);
                string = "TiB";
            } else if (size >= 1024 * 1024 * 1024 / 10) {
                size = size / (1024 * 1024 * 1024 / 10);
                string = "GiB";
            } else if (size >= 1024 * 1024 / 10) {
                size = size / (1024 * 1024 / 10);
                string = "MiB";
            } else if (size >= 1024 / 10) {
                size = size / (1024 / 10);
                string = "KiB";
            } else {
                size = size * 10;
                string = "b";
            }
            return (Math.round(size) / 10) + string;
        }
    })
    .filter('fileicon', function() {
        return function(ext) {
            if (ext) {
                ext = ext.toLowerCase();
                if (ext.indexOf('.') > -1) {
                    ext = ext.substring(ext.indexOf('.') + 1);
                }
                var icon;
                switch (ext) {
                    case 'doc':
                    case 'docx':
                        icon = 'attachment-type-docx';
                        break;
                    case 'xls':
                    case 'xlsx':
                        icon = 'attachment-type-xlsx';
                        break;
                    case 'ppt':
                    case 'pptx':
                        icon = 'attachment-type-pptx';
                        break;
                    case 'pdf':
                        icon = 'attachment-type-pdf';
                        break;
                    case 'psd':
                        icon = 'attachment-type-psd';
                        break;
                    case 'ai':
                        icon = 'attachment-type-ai';
                        break;
                    case 'idml':
                        icon = 'attachment-type-idml';
                        break;
                    case 'png':
                    case 'gif':
                    case 'jpg':
                    case 'jpeg':
                    case 'svg':
                    case 'bmp':
                        icon = 'attachment-type-picture';
                        break;
                    case 'mp3':
                    case 'wave':
                    case 'aac':
                    case 'avi':
                    case 'flv':
                    case 'mp4':
                    case 'mpg':
                    case 'mpeg':
                        icon = 'attachment-type-media';
                        break;
                    default :
                        icon = 'attachment-type-default attachment-type-' + ext;
                }
                return icon;
            }
        }
    })
    .filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    })
    .filter('workspaceUrl', ['$rootScope', 'WorkspaceType', function($rootScope, WorkspaceType) {
        return function(workspaceType, workspaceKey, viewName) {
            var workspacePath = workspaceType === WorkspaceType.PORTFOLIO ? 'f' : 'p';
            return $rootScope.serverUrl + '/' + workspacePath + '/' + workspaceKey + '/' + (viewName ? "#/" + viewName : '');
        };
    }])
    .filter('projectUrl', ['workspaceUrlFilter', 'WorkspaceType', function(workspaceUrlFilter, WorkspaceType) {
        return _.bind(workspaceUrlFilter, null, WorkspaceType.PROJECT);
    }])
    .filter('portfolioUrl', ['workspaceUrlFilter', 'WorkspaceType', function(workspaceUrlFilter, WorkspaceType) {
        return _.bind(workspaceUrlFilter, null, WorkspaceType.PORTFOLIO);
    }])
    .filter('flowFilesNotCompleted', function() {
        return function(items) {
            var filtered = [];
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (!item.isComplete()) {
                        filtered.push(item);
                    }
                }
            }
            return filtered;
        };
    })
    .filter('activityName', ['$rootScope', '$filter', function($rootScope, $filter) {
        return function(activity, hideType) {
            if (activity.code == 'updateState') {
                return $rootScope.message('is.fluxiable.' + activity.code, [$filter('i18n')(activity.afterValue, 'StoryStates')]) + ' ' + $rootScope.message('is.story');
            } else if (hideType) {
                var code = activity.code == 'update' ? 'updateField' : activity.code;
                return $rootScope.message('is.fluxiable.' + code, [activity.label]);
            } else {
                var type = activity.parentType;
                if (activity.code == 'acceptanceTestDelete') {
                    type = 'acceptanceTest';
                } else if (activity.code == 'taskDelete') {
                    type = 'task';
                } else if (activity.code == 'delete') {
                    type = 'story'
                }
                return $rootScope.message('is.fluxiable.' + activity.code, [activity.label]) + ' ' + $rootScope.message('is.' + type);
            }
        };
    }])
    .filter('percentProgress', [function() {
        return function(current, count) {
            return Math.floor((current * 100) / count);
        }
    }]).filter('dateToIso', ['dateFilter', function(dateFilter) {
    return function(date) {
        return dateFilter(date, 'yyyy-MM-ddTHH:mm:ssZ');
    };
}]).filter('dateTime', ['$rootScope', 'dateFilter', function($rootScope, dateFilter) {
    return function(date) {
        return dateFilter(date, $rootScope.message('is.date.format.short.time'));
    };
}]).filter('dayShort', ['$rootScope', 'dateFilter', function($rootScope, dateFilter) {
    return function(date) {
        return dateFilter(date, $rootScope.message('is.date.format.short'), 'utc');
    };
}]).filter('dayShorter', ['$rootScope', 'dateFilter', function($rootScope, dateFilter) {
    return function(date) {
        return dateFilter(date, $rootScope.message('is.date.format.shorter'), 'utc');
    };
}]).filter('orElse', [function() {
    return function(value, defaultValue) {
        return (!_.isUndefined(value) && !_.isNull(value)) ? value : defaultValue;
    };
}]).filter('orFilter', [function() {
    return function(items, patternObject) {
        if (angular.isArray(items)) {
            return _.filter(items, function(item) {
                return _.some(_.toPairs(patternObject), function(objectProperty) {
                    var key = objectProperty[0];
                    var value = objectProperty[1].toString().toLowerCase();
                    return item[key].toString().toLowerCase().indexOf(value) !== -1;
                });
            });
        } else {
            return items;
        }
    }
}]).filter('search', ['$rootScope', function($rootScope) {
    return function(items) {
        var term = $rootScope.application.search;
        var fields = ['name', 'description', 'notes', 'uid']; // Hardcoded for the moment because it is always the same
        if (!_.isEmpty(items) && !_.isEmpty(term) && !_.isEmpty(fields)) {
            var searchTerm = _.deburr(_.trim(term.toString().toLowerCase()));
            return _.filter(items, function(item) {
                return _.some(fields, function(field) {
                    var value = _.get(item, field);
                    if (!_.isUndefined(value) && !_.isNull(value)) {
                        return _.deburr(value.toString().toLowerCase()).indexOf(searchTerm) != -1;
                    } else {
                        return false;
                    }
                });
            });
        } else {
            return items;
        }
    }
}]).filter('taskBoardSearch', ['searchFilter', function(searchFilter) {
    return function(stories, tasksByStoryByState) {
        var matchingStories = _.map(searchFilter(stories), 'id');
        return _.filter(stories, function(story) {
            return _.includes(matchingStories, story.id) || searchFilter(_.flatten(_.values(tasksByStoryByState[story.id]))).length > 0;
        });
    }
}]).filter('storyLabel', [function() {
    return function(story, after, displayProject) {
        if (story) {
            var label = after ? story.name + ' - ' + story.uid : story.uid + ' - ' + story.name;
            if (displayProject) {
                label += ' (' + story.project.name + ')';
            }
            return label;
        }
    }
}]).filter('sprintName', ['$rootScope', function($rootScope) {
    return function(sprint) {
        if (sprint) {
            return $rootScope.message('is.sprint') + ' ' + sprint.index;
        }
    }
}]).filter('sprintNameWithState', ['$rootScope', 'sprintNameFilter', 'SprintStatesByName', function($rootScope, sprintNameFilter, SprintStatesByName) {
    return function(sprint) {
        if (sprint) {
            return sprintNameFilter(sprint) + (sprint.state === SprintStatesByName.IN_PROGRESS ? ' (' + $rootScope.message('is.sprint.state.inprogress') + ')' : '');
        }
    }
}]).filter('computePercentage', [function() {
    return function(object, value, onValue) {
        var val = Math.round((object[value] * 100) / object[onValue]);
        return val > 100 ? 100 : val;
    }
}]).filter('stripTags', [function() {
    return function(input, disallowed) {
        disallowed = (((disallowed || '') + '')
                          .toLowerCase()
                          .match(/<[a-z][a-z0-9]*>/g) || [])
            .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        return input.replace(tags, function($0, $1) {
            return disallowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? ' ' : $0;
        });
    }
}]).filter('allMembers', [function() {
    return function(project) {
        return _.unionBy(project.team.members, project.productOwners, 'id');
    }
}]).filter('acceptanceTestColor', ['AcceptanceTestStatesByName', function(AcceptanceTestStatesByName) {
    return function(state) {
        var colorClass;
        switch (state) {
            case AcceptanceTestStatesByName.TOCHECK:
                colorClass = 'default';
                break;
            case AcceptanceTestStatesByName.FAILED:
                colorClass = 'danger';
                break;
            case AcceptanceTestStatesByName.SUCCESS:
                colorClass = 'success';
                break;
        }
        return colorClass;
    }
}]).filter('merge', [function() {
    return function(object, defaultObject) {
        return _.merge(object, defaultObject);
    }
}]).filter('acceptanceTestIcon', ['AcceptanceTestStatesByName', function(AcceptanceTestStatesByName) {
    return function(state) {
        var icon = 'acceptance-test-icon acceptance-test-icon-';
        switch (state) {
            case AcceptanceTestStatesByName.TOCHECK:
                icon += 'tocheck';
                break;
            case AcceptanceTestStatesByName.FAILED:
                icon += 'failed';
                break;
            case AcceptanceTestStatesByName.SUCCESS:
                icon += 'success';
                break;
        }
        return icon;
    }
}]).filter('sprintStateColor', ['SprintStatesByName', function(SprintStatesByName) {
    return function(state, prefix) {
        var colorState = (prefix ? prefix + '-' : '') + 'sprint-';
        switch (state) {
            case SprintStatesByName.TODO:
                colorState += 'todo';
                break;
            case SprintStatesByName.IN_PROGRESS:
                colorState += 'inProgress';
                break;
            case SprintStatesByName.DONE:
                colorState += 'done';
                break;
        }
        return colorState;
    }
}]).filter('releaseStateColor', ['ReleaseStatesByName', function(ReleaseStatesByName) {
    return function(state) {
        var colorState = 'release-';
        switch (state) {
            case ReleaseStatesByName.TODO:
                colorState += 'todo';
                break;
            case ReleaseStatesByName.IN_PROGRESS:
                colorState += 'inProgress';
                break;
            case ReleaseStatesByName.DONE:
                colorState += 'done';
                break;
        }
        return colorState;
    }
}]).filter('i18nName', ['$rootScope', function($rootScope) {
    return function(object) {
        if (object) {
            return _.startsWith(object.name, 'is.') || _.startsWith(object.name, 'todo.is.') ? $rootScope.message(object.name) : object.name;
        }
    }
}]).filter('sumBy', [function() {
    return function(objs, property) {
        return _.sumBy(objs, property);
    }
}]).filter('roundNumber', [function() {
    return function(number, nbDecimals) {
        var multiplicator = Math.pow(10, nbDecimals);
        return Math.round(number * multiplicator) / multiplicator;
    }
}]).filter('maxDecimalCount', [function() {
    return function(numbers) {
        return Math.pow(10, _.max(_.map(numbers, function(number) {
            var parts = number.toString().split('.');
            return parts.length > 1 ? parts[1].length : 0;
        })));
    }
}]).filter('preciseFloatSum', ['maxDecimalCountFilter', function(maxDecimalCountFilter) {
    return function(numbers) {
        var multiplicator = maxDecimalCountFilter(numbers);
        return _.sumBy(numbers, function(number) {
            return number * multiplicator;
        }) / multiplicator;
    }
}]).filter('floatSumBy', ['preciseFloatSumFilter', function(preciseFloatSumFilter) {
    return function(items, path) {
        var total = preciseFloatSumFilter(_.filter(_.map(items, path), _.id));
        return total ? total : 0;
    }
}]).filter('yesNo', ['$rootScope', function($rootScope) {
    return function(boolean) {
        return $rootScope.message(boolean ? 'is.yes' : 'is.no');
    }
}]).filter('visibleMenuElement', function() {
    return function(menus, item, viewType) {
        return _.filter(menus, function(menuElement) {
            return menuElement.visible(item, viewType);
        })
    };
}).filter('contextIcon', function() {
    return function(contextType) {
        return {
            feature: 'fa-puzzle-piece',
            tag: 'fa-tag',
            actor: 'fa-child'
        }[contextType];
    }
}).filter('contextStyle', function() {
    return function(context) {
        return context && context.color ? {
            "background-color": context.color,
            "border-color": context.color
        } : '';
    }
}).filter('parens', function() {
    return function(inside) {
        return inside ? '(' + inside + ')' : '';
    }
}).filter('countAndRemaining', function() {
    return function(story) {
        return story.tasks_count ? '(' + story.tasks_count + (story.totalRemainingTime ? ' - ' + story.totalRemainingTime : '') + ')' : '';
    }
}).filter('ellipsis', ['limitToFilter', function(limitToFilter) {
    return function(text, limit, moreSign) {
        if (!moreSign) {
            moreSign = '...';
        }
        return text ? limitToFilter(text, limit) + (text.length > limit ? moreSign : '') : text;
    }
}]).filter('retrieveBacklog', function() {
    return function(project, code) {
        var backlog = _.find(project.backlogs, {'code': code});
        backlog.project = project;
        return backlog;
    }
}).filter('newStoryTypes', function() { // Can be overrided by plugins
    return function(storyTypes) {
        return storyTypes;
    }
}).filter('followedByUser', ['Session', function(Session) {
    return function(story, returnIfTrue, returnIfFalse) {
        return Session.user ? (_.find(story.followers_ids, {id: Session.user.id}) ? (returnIfTrue ? returnIfTrue : true) : (returnIfFalse ? returnIfFalse : false)) : (returnIfFalse ? returnIfFalse : false);
    }
}]).filter('message', ['I18nService', function(I18nService) {
    return I18nService.message;
}]).filter('idSizeClass', function() {
    return function(item) {
        if (!item || item.uid < 99) {
            return '';
        } else if (item.uid > 999) {
            return 'id-size-xs';
        } else {
            return 'id-size-sm';
        }
    }
}).filter('relevantMeetings', function() {
    return function(meetings, subject) {
        if (meetings) {
            var filter = {endDate: null};
            if (subject.class !== 'Project' && subject.class !== 'Portfolio') {
                filter.subjectId = subject.id;
                filter.subjectType = subject.class.toLowerCase();
            }
            return _.filter(meetings, filter);
        } else {
            return []
        }
    }
}).filter('imageByScheme', ['$rootScope', function($rootScope) {
    return function(imageUrl) {
        return $rootScope.getColorScheme() === 'dark' ? imageUrl.dark : imageUrl.light;
    }
}]).filter('limitTextColor', function() {
    return function(actual, limit) {
        var color;
        if (limit == null || actual < limit) {
            color = 'success';
        } else if (actual === limit) {
            color = 'warning';
        } else {
            color = 'danger';
        }
        return 'text-' + color;
    };
});