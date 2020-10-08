/*
 * Copyright (c) 2016 Kagilum SAS.
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

extensibleController('chartCtrl', ['$rootScope', '$scope', '$element', '$filter', '$uibModal', '$timeout', 'WindowService', 'Session', 'PortfolioService', 'ProjectService', 'SprintService', 'ReleaseService', 'BacklogService', function($rootScope, $scope, $element, $filter, $uibModal, $timeout, WindowService, Session, PortfolioService, ProjectService, SprintService, ReleaseService, BacklogService) {
    $scope.defaultOptions = {
        chart: {
            height: 350,
            noData: $rootScope.message('is.loading')
        }
    };
    $scope.chartLoaders = {
        project: function(chartName, project) {
            return ProjectService.openChart(project, chartName);
        },
        release: function(chartName, release) {
            return ReleaseService.openChart(release, chartName);
        },
        sprint: function(chartName, sprint) {
            return SprintService.openChart(sprint, $scope.project ? $scope.project : $scope.getProjectFromState(), chartName);
        },
        backlog: function(chartName, backlog) {
            var chartNameParts = chartName.split('-'); // Hack to preserve the chartLoaderInterface while using an additional parameter
            var chartType = chartNameParts[0];
            var chartUnit = chartNameParts.length > 1 ? chartNameParts[1] : 'story';
            return BacklogService.openChart(backlog, backlog.project, chartType, chartUnit);
        },
        portfolio: function(chartName, portfolio) {
            return PortfolioService.openChart(portfolio, chartName);
        }
    };
    var computeDomain = function(index) {
        return function(data) {
            var max = _.max(_.map(data, function(line) {
                return _.max(_.map(line.values, function(dataPoint) {
                    return dataPoint[index];
                }));
            }));
            return [0, Math.ceil(max * 0.05) + max]; // Add margin
        };
    };
    $scope.chartOptions = {
        project: {
            default: {
                chart: {
                    type: 'lineChart',
                    x: function(entry, index) { return index; },
                    y: function(entry) { return entry[0]; },
                    xAxis: {
                        tickFormat: function(entry) {
                            return $scope.labelsX[entry];
                        }
                    }
                },
                computeYDomain: computeDomain(0)
            },
            flowCumulative: {
                chart: {
                    type: 'stackedAreaChart',
                    margin: {right: 45}
                },
                computeYDomain: null
            },
            burndown: {
                chart: {
                    type: 'multiBarChart',
                    stacked: true
                },
                computeYDomain: null
            },
            burnup: {
                chart: {
                    margin: {right: 45}
                }
            },
            velocity: {
                chart: {
                    type: 'multiBarChart',
                    stacked: true
                },
                computeYDomain: null
            },
            parkingLot: {
                chart: {
                    type: 'multiBarHorizontalChart',
                    x: function(entry) { return entry[0]; },
                    y: function(entry) { return entry[1]; },
                    showValues: true,
                    xAxis: {
                        tickFormat: function(entry) {
                            return _.truncate(entry, {length: 16});
                        }
                    },
                    margin: {
                        left: 125
                    },
                    showControls: false
                },
                computeYDomain: null
            }
        },
        release: {
            default: {
                chart: {
                    type: 'lineChart',
                    x: function(entry, index) { return index; },
                    y: function(entry) { return entry[0]; },
                    xAxis: {
                        tickFormat: function(entry) {
                            return $scope.labelsX[entry];
                        }
                    }
                },
                computeYDomain: computeDomain(0)
            },
            parkingLot: {
                chart: {
                    type: 'multiBarHorizontalChart',
                    x: function(entry) { return entry[0]; },
                    y: function(entry) { return entry[1]; },
                    showValues: true,
                    xAxis: {
                        tickFormat: function(entry) {
                            return _.truncate(entry, {length: 16});
                        }
                    },
                    margin: {
                        left: 125
                    },
                    showControls: false
                },
                computeYDomain: null
            },
            burndown: {
                chart: {
                    type: 'multiBarChart',
                    stacked: true
                },
                computeYDomain: null
            },
            velocity: {
                chart: {
                    type: 'multiBarChart',
                    stacked: true
                },
                computeYDomain: null
            }
        },
        sprint: {
            default: {
                chart: {
                    type: 'lineChart',
                    x: function(entry) { return entry[0]; },
                    y: function(entry) { return entry[1]; },
                    xScale: d3.time.scale.utc(),
                    xAxis: {
                        tickFormat: $filter('dayShorter'),
                        showMaxMin: false
                    }
                },
                computeYDomain: computeDomain(1)
            }
        },
        backlog: {
            default: {
                chart: {
                    type: 'pieChart',
                    donut: true,
                    height: 200,
                    x: function(entry) { return entry[0]; },
                    y: function(entry) { return entry[1]; },
                    showLabels: true,
                    duration: 500,
                    showLegend: false,
                    margin: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }
                },
                title: {
                    enable: false
                },
                caption: {
                    enable: true
                }
            }
        },
        portfolio: {
            default: {
                chart: {
                    type: 'lineChart',
                    x: function(entry, index) { return index; },
                    y: function(entry) { return entry[0]; },
                    xAxis: {
                        tickFormat: function(entry) {
                            return $scope.labelsX[entry];
                        }
                    }
                },
                computeYDomain: computeDomain(0)
            }
        }
    };
    $scope.openChart = function(itemType, chartName, item, options) {
        $scope.cleanData();
        $scope.chartParams = {
            item: item,
            itemType: itemType,
            chartName: chartName
        };
        $scope.options = _.merge({}, $scope.defaultOptions);
        $scope.options = _.merge($scope.options, $scope.chartOptions[itemType]['default']);
        $scope.options = _.merge($scope.options, $scope.chartOptions[itemType][chartName] ? $scope.chartOptions[itemType][chartName] : {});
        $scope.options = _.merge($scope.options, options ? options : {});
        return $scope.chartLoaders[itemType](chartName, item).then(function(chart) {
            // Timeout is required for new options to be taken into account correctly when chartLoader is too fast
            return $timeout(function() {
                $scope.data = chart.data;
                $scope.options = _.merge($scope.options, chart.options);
                $scope.options = _.merge($scope.options, options);
                if ($scope.options.computeYDomain) {
                    $scope.options.chart.yDomain = $scope.options.computeYDomain(chart.data);
                }
                $scope.options.title.enable = !_.isEmpty($scope.options.title) && $scope.options.title.enable !== false;
                if (chart.labelsX) {
                    $scope.labelsX = chart.labelsX;
                }
                if (chart.labelsY) {
                    $scope.labelsY = chart.labelsY;
                }
                if (angular.isFunction($scope.options.chart.height)) {
                    $scope.options.chart.height = $scope.options.chart.height($element);
                }
                $scope.options.chart.noData = $rootScope.message('is.chart.error.no.values');
                $scope.chartLoaded = true;
                return chart;
            });
        });
    };
    $scope.openChartAndSaveSetting = function(itemType, chartName, item, workspace, windowName, settingName, options) {
        if (Session.authenticated()) {
            WindowService.get(windowName, workspace).then(function(window) {
                window.settings[settingName] = {itemType: itemType, chartName: chartName};
                return WindowService.update(window).$promise;
            });
        }
        $scope.openChart(itemType, chartName, item, options);
    };
    $scope.processSaveChart = function(title) {
        saveChartAsPng($element.find('svg')[0], {}, title, function(imageBase64) {
            // Server side "attachment" content type is needed because the a.download HTML5 feature is not supported in crappy browsers (safari & co).
            jQuery.download($scope.serverUrl + '/saveImage', {'image': imageBase64, 'title': title});
        });
    };

    $scope.openChartInModal = function(chartParams) {
        $uibModal.open({
            templateUrl: 'chart.modal.html',
            size: 'wide',
            controller: ["$scope", "$controller", "hotkeys", "$window", function($scope, $controller, hotkeys, $window) {
                $element = angular.element('.modal-wide');
                $controller('chartCtrl', {$scope: $scope, $element: $element});
                $scope.defaultOptions.chart.height = ($window.innerHeight * 75 / 100);
                $scope.chartTitle = $scope.message('is.ui.project.chart.title');
                $scope.openChart(chartParams.itemType, chartParams.chartName, chartParams.item, {title: {enable: false}}).then(function(data) {
                    if (data.options.title.text) {
                        $scope.chartTitle = data.options.title.text;
                    }
                });
                $scope.submit = function() {
                    $scope.$close(true);
                };
                // Required because there is not input so the form cannot be submitted by "return"
                hotkeys.bindTo($scope).add({
                    combo: 'return',
                    callback: function(event) {
                        event.preventDefault(); // Prevents propagation of click to unwanted places
                        $scope.submit();
                    }
                });
            }]
        });
    };
    $scope.saveChart = function(chartParams) {
        $uibModal.open({
            templateUrl: 'chart.modal.html',
            size: 'chart invisible',
            controller: ["$scope", "$controller", "$window", "$timeout", function($scope, $controller, $window, $timeout) {
                $timeout(function() {
                    $controller('chartCtrl', {$scope: $scope, $element: angular.element('.modal-chart')});
                    $scope.defaultOptions.chart.width = 1600;
                    $scope.defaultOptions.chart.height = 800;
                    $scope.openChart(chartParams.itemType, chartParams.chartName, chartParams.item).then(function(data) {
                        var title = '';
                        if (data.options.title.text) {
                            title = data.options.title.text;
                        }
                        $timeout(function() {
                            $scope.processSaveChart(title);
                            $scope.$close(true)
                        }, 500);
                    });
                }, 500);
            }]
        });
    };
    $scope.cleanData = function() {
        $scope.data = [];
        $scope.labelsX = [];
        $scope.labelsY = [];
        $scope.options = {};
        $scope.chartLoaded = false;
    };
    // Init
    $scope.cleanData();
}]);

controllers.controller('chartWidgetCtrl', ['$scope', 'WidgetService', 'FormService', 'ProjectService', '$controller', '$element', function($scope, WidgetService, FormService, ProjectService, $controller, $element) {
    $controller('widgetCtrl', {$scope: $scope});
    $controller('chartCtrl', {$scope: $scope, $element: $element});
    $scope.getChartWidgetOptions = function(widget) {
        var chartWidgetOptions = {
            chart: {
                height: function($element) {
                    return $element ? $element.parents('.card-body')[0].getBoundingClientRect().height : 0;
                }
            },
            title: {
                enable: false
            }
        };
        if (widget.width === 1 || widget.height === 1) {
            chartWidgetOptions = _.merge(chartWidgetOptions, {
                chart: {
                    showXAxis: false,
                    showYAxis: false,
                    showLegend: false,
                    margin: {top: 30, right: 0, bottom: 15, left: 0}
                },
                title: {
                    enable: false
                }
            });
        }
        return chartWidgetOptions;
    }
}]);