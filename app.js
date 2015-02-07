$(document).on('touchmove', function(e) {
    e.preventDefault();
});
         
window.closeWindow = (function() {            
    var isWindowRef = null;            
    setInterval(function() {
        // 새로열린 창이 닫혔을 때 다시 버튼 클릭 시 동작이 실행이 되어야 하므로 해당 객체를 삭제
        isWindowRef = (isWindowRef && isWindowRef.window) ? isWindowRef : null;            
    }, 1000);
                 
    return function(windowRef, time, redirectUrl) {                 
        // 새로열린 Window에서 백버튼 누를 시 해당 함수가 계속 호출되는 무한루프 방지                 
        if (isWindowRef == null) {                    
            isWindowRef = windowRef;                     
            setTimeout(function() {                        
                try {                             
                    // Custom Scheme 이 실행되지 않고 잘못된 페이지가 노출된 상태에서
                    // 아래의 코드 실행 시 Security Error 발생
                    windowRef.location == 'undefind';                              
                    // Custom Scheme 이 실행되었다면 앱 종료 후 해당 tab 을 닫는다.                                  
                    windowRef.close();                         
                } catch (e) {                            
                    windowRef.location.href = redirectUrl;                        
                }                    
            }, time);                    
            return true;                
        }            
    }        
})();         

var app = angular.module("surveyPlatform", ["ngRoute", "ngAnimate", "ngMaterial"]);

// app.config(['$routeProvider',
//     function($routeProvider) {
//         $routeProvider.when('/list', {
//             templateUrl: 'static/pages/popupList.html',
//             controller: 'listController'
//         }).otherwise({
//             redirectTo: '/list'
//         });
//     }
// ]);

app.service("resource", function() {
    this.createData = function(data) {
        this.data = data;
    }
    this.readData = function(index) {
        return this.data[index];
    }
    this.device = (function() {
        var isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
            }
        };

        if (isMobile.Android()) {
            return {
                "android": ["android_deeplink", "googleplay_url"]
            };
        } else if (isMobile.iOS()) {
            return {
                "ios": ["ios_deeplink", "iTunes_url"]
            };
        } else {
            return {
                "else": []
            };
        }
    })();
    this.pickImage = function(name) {
        switch (name) {
            case "beat":
                return "static/images/Beat.png";

            case "navermusic":
                return 'static/images/Navermusic.png';

            case "youtube":
                return 'static/images/Youtube.png';

            case "melon":
                return 'static/images/Melon.png';

            case "bugs":
                return 'static/images/Bugs.png';

        }
        // 'static/images/Soundcloud.png'
    }
    this.createGridData = function(data) {
        this.gridData = data;
    }
    this.readGridData = function() {
        return this.gridData;
    }
    return this;
});

app.controller("AppCtrl", ["$scope", "$rootScope", "$timeout", "$mdSidenav", "$log", "$http", "$animate", "$mdBottomSheet", "resource",
    function($scope, $rootScope, $timeout, $mdSidenav, $log, $http, $animate, $mdBottomSheet, resource) {
        $scope.results = [];
        $scope.searchQuery = undefined;
        $scope.resultsNumber = undefined;
        $scope.index = undefined;

        $("#progress-circular").hide();

        $scope.toggleLeft = function() {
            $mdSidenav('left').toggle().then(function() {
                $log.debug("toggle LEFT is done");
            });
        };

        $scope.executeSearch = function() {
            $("#progress-circular").show(500);
            $http.post("http://128.199.76.251:5000/search/", {
                type: "music",
                query: $scope.searchQuery
            }).
            success(function(data, status, headers, config) {
                $("#progress-circular").hide(500);
                $scope.resultsNumber = data.length;
                $scope.results = data;
                resource.createData(data);
            }).
            error(function(data, status, headers, config) {});
        }

        $scope.showBottomGrid = function($event) {
            var selectedData = resource.readData($scope.index);
            var gridItems = [];
            selectedData["deep_links"].forEach(function(item, index) {
                var gridItem = {};
                gridItem.name = item["name"];
                gridItem.image = resource.pickImage(item["name"]);
                if (resource.device["android"]) {
                    gridItem.device = "android";
                    gridItem.deeplink = item[resource.device["android"][0]];
                    gridItem.marketlink = item[resource.device["android"][1]];
                } else if (resource.device["ios"]) {
                    gridItem.device = "ios";
                    gridItem.deeplink = item[resource.device["ios"][0]];
                    gridItem.marketlink = item[resource.device["ios"][1]];
                }
                gridItems.push(gridItem);
            });
            resource.createGridData(gridItems);
            $mdBottomSheet.show({
                templateUrl: './static/pages/bottomGrid.html',
                controller: 'bottomGridController',
                targetEvent: $event
            }).then(function(clickedItem) {
                console.log(resource.readGridData());
            });
        };
    }
]);

app.controller('LeftCtrl', function($scope, $timeout, $mdSidenav, $log) {
    $scope.close = function() {
        $mdSidenav('left').close().then(function() {
            $log.debug("close LEFT is done");
        });
    };
});

app.controller('bottomGridController', ["$scope", "$rootScope", "$mdBottomSheet", "$window", "resource",
    function($scope, $rootScope, $mdBottomSheet, $window, resource) {
        $scope.items = resource.readGridData();
        $scope.listItemClick = function($index, name, deeplink, marketlink) {
            if (resource.device["android"]) {
                // $window.location.href = deeplink;
                var openWindow = window.open('./openWindow.html#' + deeplink + "#" + marketlink);
            } else if (resource.device["ios"]) {
                window.setTimeout(function() {
                    document.getElementById("loader").src = marketlink;
                }, 1000);
                document.getElementById("loader").src = deeplink;
            }
        };
        $scope.noItem = function(){
            return $scope.items.length === 0;
        };
    }
]);