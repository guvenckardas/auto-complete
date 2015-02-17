(function ($) {
    $.fn.userSearch = function(options){
        var defaults = {
            'source'          : '',
            'deferRequest'    : 250,
            'width'           : '',
            'selectedCssClass': '',
            'mainCssClass'    : '',
            'isAutoComplete'  : false,
            'maxRow'          : 5,
            'content'         : '',
            'emptyDataContent': '',
            'fullContextSearch': false,
            'isCaseSensitive'  : false,
            'disableRemove'    : false,
            'characterReq'     : 2,
            'mainTargetData'   : ''
        };
        var options = $.extend(defaults,options);

        var Controller = function(_this){
            var _controller = this;
            _controller.target = $(_this)[0];
            _controller.id = _controller.target.id;
            _controller.coverDiv = "";
            $(_controller.target).attr('autocomplete','off');
            $(_controller.target).wrap('<div class="inputController wrapper"></div>');

            _controller.targetValue ="";
            _controller.queryValue  ="";
            _controller.stepValue = 0;
            _controller.rowValue = 0;
            _controller.pendingRequest = false;

            _controller.bindEvents = function(){
                /*control enter key for form element*/
                $(_controller.target).bind('keydown',function(e){
                    if(e.keyCode == 13){
                        _controller.panelRemove();



                        return false;
                    }
                    $(_controller.target).parent().siblings('.inputTxt').hide();
                });




                /*start the key action for input text panel*/
                $(_controller.target).bind('keyup',function(e){

                    var returner = _controller.keyCodeController(e.keyCode); //check keycodes if blocked
                    var contentController = _controller.contentController(); //check domElemnt if is display true or false

                    if ($(_controller.target).val != "" && !returner) {
                        var _value = $(_controller.target)[0].value;
                        if($.trim(_value).length>(options.characterReq-1))
                        {
                            if($.trim(_value) != _controller.targetValue){
                                _controller.queryValue = $.trim(_value);
                                if(_controller.pendingRequest == false){
                                    clearTimeout(_controller.typingTimer);
                                    _controller.typingTimer = setTimeout(_controller.doneTyping, options.deferRequest);
                                }
                            }
                            _controller.targetValue = $.trim(_value);
                        }else
                        {
                            _controller.panelRemove();
                        }
                    }
                    else if(returner && !contentController){ // Control search Panel actions
                        $(_controller.coverDiv).find('.inputController.mainPanel').removeClass('selected');
                        _controller.domSelector(e.keyCode);
                    }

                });

                _controller.controlTaget = options.mainTargetData;

                /*active function when blur event triggered*/
                $(_controller.target).bind('blur', _controller.panelRemove);




            };


            /**
             *
             */
            $(_controller.target).ajaxStart(function(){
                _controller.pendingRequest = true;
            });


            /**
             * The keyboard controller for search Panel
             * @param keyCode event keycode
             */
            _controller.domSelector = function(keyCode){
                switch(keyCode){


                    case 38: //up action
                        _controller.stepValue = (_controller.stepValue -1) < 1 ?_controller.rowValue : (_controller.stepValue-1);
                        _controller.StepAction( _controller.stepValue );
                        break;
                    case 40: //down action
                        _controller.stepValue = (_controller.stepValue +1) > _controller.rowValue ? 1 : (_controller.stepValue+1);
                        _controller.StepAction( _controller.stepValue );
                        break;
                    case 27: // escape action
                        _controller.panelRemove();
                        break;
                    case 39: // right action
                        _controller.stepValue = 0;
                        break;
                    case 37: // left action
                        _controller.stepValue = 0;
                        break;
                }
            };

            _controller.StepAction = function(stepValue){
                $(_controller.coverDiv).find('.inputController.mainPanel:eq('+(stepValue-1)+')').addClass('selected');
                var innerText =  $(_controller.coverDiv).find('.inputController.mainPanel:eq('+(stepValue-1)+')').find('[targetData="'+_controller.controlTaget+'"]').text();
                _controller.dataSender(innerText);
            };

            /**
             * The block keyboard controller
             * @param keyCode event key code
             * @return {Boolean}
             */
            _controller.keyCodeController = function(keyCode){
                var isBlocked = false;
                var blockkeyCodeArray = [37,38,39,40,33,34,35,36,93,20,27,16,17,13];
                $(blockkeyCodeArray).each(function(e,ui){
                    if(keyCode == ui){
                        isBlocked = true;
                    }
                });
                return isBlocked;
            }
            /**
             * Panel controller
             * @return {Boolean}
             */
            _controller.contentController = function(){
                var isEmpty = false;
                if($('.inputController.mainPanel').length <= 0){
                    isEmpty = true;
                }
                return isEmpty;
            }

            /**
             * Main controller. Appears when the key up, if possibilities are true
             * @param value
             */
            _controller.doneTyping = function(){
                // _controller.left = $(_controller.target).offset().left;
                // _controller.top = $(_controller.target).offset().top + $(_controller.target).outerHeight();
                // _controller.width = (options.width == '') ? $(_controller.target).outerWidth() : options.width;
                _controller.width = '100%';


                if(typeof(options.source) != "object"){
                    _controller.ajaxAction();

                }
                else{
                    _controller.arrayAction();
                }
            }


            _controller.ajaxAction = function(){
                var data = "";
                var operationSuccess = false;
                var query = _controller.queryValue;

                var request = $.ajax({
                    url:options.source+'='+query,
                    cache:false,
                    dataType:"json",
                    success:function (_data) {

                        data = _data;
                        operationSuccess = true;
                    },
                    complete:function (e, xhr) {

                        if(operationSuccess == false){
                            data = "";
                        }
                        _controller.pendingRequest = false;
                        _controller.endAction(data,query);
                        if(query!=_controller.queryValue){
                            _controller.targetValue ="";
                            $(_controller.target).trigger('keyup');
                        }
                    }
                });
            }

            _controller.arrayAction= function(){
                var data =  getArrayData(options.source,_controller.queryValue);
                _controller.endAction(data);
            }

            _controller.endAction = function(_data,query){

                if(_controller.targetValue != ""){
                    /* Start Complete function */
                    var data = _data;
                    if(data.length<=0){
                        if(!options.disableRemove){
                            $(_controller.coverDiv).find('.inputController.infoPanel').remove();
                            $(_controller.coverDiv).remove();
                        }
                        if(options.emptyDataContent != ""){
                            _controller.coverDiv = _controller.makeCoverDom();
                            var domMainObj = document.createElement('div');
                            $(domMainObj).addClass('inputController infoPanel');
                            $(domMainObj).append(options.emptyDataContent);
                            $(_controller.coverDiv).append(domMainObj);
                        }
                        _controller.stepValue = 0;
                    }
                    else{
                        _controller.coverDiv = _controller.makeCoverDom();
                        if(!options.disableRemove) {
                            $('.inputController.infoPanel').remove();
                        }

                        _controller.rowValue =  data.length > options.maxRow ? options.maxRow : data.length;

                        if(_controller.queryValue != ""){
                            var queryvalue = query || _controller.queryValue;
                            var _domCreator = new domCreator(data,_controller.rowValue ,queryvalue);
                        }

                    }
                    /* End Complete function */
                }else{
                    if(!options.disableRemove) {
                        $(_controller.coverDiv).remove();
                    }
                }

            }


            /**
             * Main dom creator for search panel
             * @param demoDataJson
             * @param controlValue
             */
            var domCreator = function(demoDataJson,controlValue,queryValue){
                if(!options.disableRemove) {
                    $('.inputController.mainPanel').remove();
                }
                for(var i=0; i< controlValue; i++){




                    var domMainObj;
                    domMainObj = document.createElement('div');
                    $(domMainObj).addClass('inputController mainPanel');
                    $(domMainObj).addClass(options.mainCssClass);
                    $(domMainObj).attr('targetId',demoDataJson[i].id);

                    $(domMainObj).hover(function(){
                        _controller.stepValue = $('.inputController.mainPanel').index(this);
                        $('.inputController.mainPanel').removeClass('selected');
                        $(this).addClass('selected');
                    },function(){
                        $(this).removeClass('selected');
                    });


                    var innerPanel;
                    innerPanel = document.createElement('div');
                    $(innerPanel).addClass('inputController innerPanel');






                        $(innerPanel).append(options.content);
                        $(innerPanel).find('*').each(function(e,ui){
                            var targetData = $(ui).attr('targetData') || "";
                            if(targetData != ""){
                                var dataPath = demoDataJson[i][targetData];
                                if($(ui).is('img')){
                                    $(ui).attr('src',dataPath)
                                }else{
                                    if($(ui).attr('targetData') == options.mainTargetData){
                                        var contentControlString = dataPath;

                                        var condition = 0;
                                        while(condition != -1){
                                            var selectedSpan = document.createElement('span');
                                            $(selectedSpan).addClass(options.selectedCssClass);
                                            var returnIndex ="";
                                            if(options.isCaseSensitive){
                                                var sensitiveControlString = contentControlString.toLowerCase();

                                                queryValue = queryValue.toLowerCase();
                                                returnIndex = sensitiveControlString.indexOf(queryValue);
                                            }
                                            else
                                            {
                                                returnIndex = contentControlString.indexOf(queryValue);
                                            }

                                            var firstSpan = contentControlString.substring(0,returnIndex);
                                            var secondSpan =contentControlString.substring(returnIndex,(returnIndex+queryValue.length));
                                            var thirdSpan =contentControlString.substring((returnIndex+ queryValue.length));
                                            $(ui).append(firstSpan);
                                            $(selectedSpan).append(secondSpan);
                                            $(ui).append(selectedSpan);
                                            if(options.fullContextSearch == true){
                                                if(thirdSpan.indexOf(queryValue) == -1){
                                                    $(ui).append(thirdSpan);
                                                    condition = -1;
                                                }
                                                contentControlString = thirdSpan;
                                            }
                                            else
                                            {
                                                $(ui).append(thirdSpan);
                                                condition = -1;
                                            }
                                        }

                                    }else{
                                        $(ui).append(dataPath);
                                    }
                                }
                            }
                        });




                    $(domMainObj).append(innerPanel);

                    /*IE 7 overflow  problem*/
                    if($.browser.msie && parseFloat($.browser.version) < 8){
                        $(innerPanel).css('overflow','hidden');
                    }

                    $(_controller.coverDiv).append(domMainObj);
                }

                $('.inputController.innerPanel').bind('click',_controller.dataSender);


            };

            /**
             * Remove cover panel content
             */
            _controller.panelRemove = function(){
                if(_controller.coverDiv != ""){
                    if(!options.disableRemove) {
                        $(_controller.coverDiv).fadeOut(250, function () {
                            $(_controller.coverDiv).remove();
                        });
                    }
                    _controller.stepValue = 0;
                    _controller.targetValue= "";
                }
                if($(_controller.target).val()==""){
                    // empty text area
                }
            }

            /**
             * The writer for input text Panel
             * @param text username value
             */
            _controller.dataSender = function(text){


                    var userText =  $('.inputController.mainPanel.selected').find('[targetData="'+options.mainTargetData+'"]').text() || text;
                    $(_controller.target).val("");
                    $(_controller.target).val(userText);
                    $(_controller.target).focus();



            };

            var getArrayData = function(array,value){
                var dataArray = [];
                var controlValue = _controller.controlTaget;

                $(array).each(function(e,ui){
                    console.log(ui,controlValue)
                    var controlData = ui[controlValue]
                    var returner = controlData.indexOf(value);

                    if(options.isCaseSensitive){
                        var controlSensitiveData = controlData.toLowerCase();
                        value = value.toLowerCase();
                        returner = controlSensitiveData.indexOf(value);
                    }

                    if(options.fullContextSearch == true){
                        if(returner != -1)
                        {
                            dataArray.push(array[e]);
                        }
                    }
                    else
                    {
                        if(returner == 0)
                        {
                            dataArray.push(array[e]);
                        }
                    }

                });
                dataArray.sort(function(a, b)
                {


                    var firstDataPath = a[controlValue].toLowerCase();
                    var secondDataPath = b[controlValue].toLowerCase();

                    if(firstDataPath < secondDataPath)
                        return -1;
                    else if(firstDataPath > secondDataPath)
                        return 1;
                    return 0;
                });
                return dataArray;
            }

            /**
             * The cover panel maker if there is not
             * @return {*} cover panel(create and return / return already there)
             */
            _controller.makeCoverDom = function(){
                var _coverDom;
                if($('.inputController.wrapper').find('.inputController.coverPanel[targetid="'+_controller.id +'"]').length > 0){
                    _coverDom = $('.inputController.wrapper').find('.inputController.coverPanel[targetid="'+_controller.id +'"]');
                }
                else
                {
                    _coverDom = document.createElement('div');
                    $(_coverDom).addClass('inputController coverPanel').attr('targetid',_controller.id );
                    $(_coverDom).width(_controller.width);

                    /*IE 7 absolute position problem*/
                    //  if($.browser.msie && parseFloat($.browser.version) < 8 || $(_controller.target).css('position') == "absolute"){
                    $(_coverDom).css('left',_controller.left+'px');
                    $(_coverDom).css('top', _controller.top+'px');
                    $(_coverDom).css('margin-top', '2px');
                    $(_coverDom).css('margin-left', '2px');
                    $('.inputController.wrapper').append(_coverDom);
                    /* }
                     else{
                     $('.inputController.wrapper').append(_coverDom);
                     }*/
                }
                return _coverDom;
            }
        }
        //Start the action
        var searchController = new Controller(this);
        searchController.bindEvents();
    }

})($);
