var app = {

    init: function()
    {
        app.sortable.init();
        app.delete.init();
        app.notify.init();
        app.ckedit.init();
        app.datetimepicker.init();
        app.slug.init();
        app.categories.init();
        app.tags.init();
        app.autoSave.init();
    },

    /**
     * Delay javascript events to
     * decrease the number of function calls
     *
     * I take no credit for this code
     * Source: http://davidwalsh.name/javascript-debounce-function
     *
     * @param fn
     * @param delay
     * @returns {Function}
     */
    debounce: function(fn, delay)
    {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    },

    /**
     * Extract the base url
     * from the current url
     *
     */
    generateBaseUrl: function()
    {
        var pathArray = location.href.split( '/' );
        var protocol = pathArray[0];
        var host = pathArray[2];
        var url = protocol + '//' + host;
        return url;
    },

    /**
     * Sort the data of a model on column name
     *
     */
    sortable: {
        url: '',

        /**
         * Listen to a click on a sortable element
         *
         */
        init: function()
        {

            $('.sort').on('click', function(e){
                e.preventDefault();
                app.sortable.fetchData(this);
                app.sortable.changeLink(this);
            });

        },

        /**
         * Fetch the new data
         *
         * @param link
         */
        fetchData: function( link )
        {
            app.sortable.url = link.href;

            $.ajax( {
                url: app.sortable.url,
                dataType: 'json'
            } ).done( function( data ) {
                app.sortable.appendData(data);
            } );
        },

        /**
         * Append the data the view
         *
         * @param data
         */
        appendData: function(data)
        {
            // get the columns of the table head
            var thead = $('.sortable thead tr');

            // get the table body
            var tbody = $('.sortable tbody');

            // Holds the data that will be appended to the view
            var append_data = "";

            // Empty the table body
            tbody.empty();

            // Loop through the results
            for ( var i = 0; i < data['data'].length; i++ )
            {
                append_data += "<tr>";

                for ( var n = 0; n < thead[0]['children'].length - 1; n++ )
                {
                    // Get the role attribute from the table head column
                    // this needs to be equal to the column name in the database
                    var columnName = thead[0]['children'][n].attributes[0].value;

                    append_data += "<td>" + data['data'][i][columnName] + "</td>";
                }

                // Append the actions to the last column
                append_data += "<td><a href='#'><span class='fa fa-edit fa-fw'></span></a> <a href='#'><span class='fa fa-trash-o fa-fw'></span></a></td>";

                append_data += "</tr>";
            }

            // Append the sorted data to the table body
            tbody.append(append_data);
        },

        /**
         * Change the table head link to it's inverse
         * asc  => desc
         * desc => asc
         *
         * @param atag
         */
        changeLink: function( atag )
        {
            var link            = $(atag);
            var url             = link[0].href;
            var urlParts        = url.split('/');
            var urlPartsLength  = urlParts.length;
            var order           = urlParts[urlPartsLength-2];
            var newUrl          = "";

            if (order == "asc")
            {
                order = "desc";
                $(".fa.fa-sort-up.fa-fw").remove();
                $(".fa.fa-sort-down.fa-fw").remove();
                link.append(' <span class="fa fa-sort-down fa-fw"></span>')
            }
            else
            {
                order = "asc";
                $(".fa.fa-sort-up.fa-fw").remove();
                $(".fa.fa-sort-down.fa-fw").remove();
                link.append(' <span class="fa fa-sort-up fa-fw"></span>')
            }

            for ( var i = 2; i < urlPartsLength - 2; i++ )
            {
                newUrl += (i ==2) ? urlParts[i] : "/" + urlParts[i];
            }

            newUrl += '/' + order;

            link[0].href = "http://" + newUrl + '/' + urlParts[urlPartsLength - 1];
        }
    },

    delete: {

        init: function()
        {
            $('.delete').on('click', function(e)
            {
                e.preventDefault();

                if ( ! confirm('Are you sure you want to delete ' + this.title + ' ?') ) return false;

                $('form.' + this.id).submit();
            });
        }

    },

    /**
     * Let flash messages fade out
     *
     */
    notify: {

        init:function()
        {
            setTimeout(function()
            {
                $('#notify').fadeOut();
            }, 3000);
        }

    },

    /**
     * WYSIWYG
     *
     */
    ckedit: {

        /**
         * Check if we need to initialize
         * the wysiwyg
         *
         */
        init:function()
        {
            if ( $('#post').length )
            {
                app.ckedit.configure();
            }
        },

        /**
         * Initialize and configure the
         * wysiwyg
         *
         */
        configure: function()
        {
            CKEDITOR.config.height = 400;
            CKEDITOR.config.extraPlugins = 'wordcount';
            CKEDITOR.replace( 'post',{
                filebrowserUploadUrl: 'http://eindwerk.app:8000/admin/posts/image/upload/'
            } );
        }
    },

    /**
     * Date time picker
     *
     */
    datetimepicker: {

        /**
         * Check if we need to initialize
         * the date time picker
         *
         */
        init:function()
        {
            if ( $('#dtBox').length )
            {
                app.datetimepicker.configure();
            }
        },

        /**
         * Initialise and configure the
         * date time picker
         *
         */
        configure: function()
        {
            $("#dtBox").DateTimePicker({
                'titleContentDateTime': 'Set the publish date and time',
                addEventHandlers: function()
                {
                    var dtPickerObj = this;
                }
            });
        }
    },

    /**
     * Auto fill in the slug field of a post
     * and check if it is a unique one
     *
     */
    slug: {
        slug: '',
        apiBaseUrl: '',

        /**
         * Check if the listener has to be called
         *
         */
        init: function()
        {
            if ( $('#title').length && $('#slug').length ) app.slug.listener();
        },

        /**
         * Listen to a keyup on the title
         * and slug field
         *
         */
        listener: function()
        {
            $('#title').keyup(app.debounce(function(e){
                app.slug.generateSlug();
            }, 1000));

            $('#slug').keyup(app.debounce(function(e){
                app.slug.slug = $('#slug')[0].value;
                app.slug.slug = app.slug.slug.replace(/ /g,"-").toLowerCase();
                app.slug.checkIfSlugIsUnique();
            }, 1000));
        },

        /**
         * Generate a valid slug
         *
         */
        generateSlug: function()
        {
            app.slug.slug = $('#title')[0].value;
            app.slug.slug = app.slug.slug.replace(/ /g,"-").toLowerCase();
            app.slug.checkIfSlugIsUnique();
        },

        /**
         * Check if the generated/given slug is unique
         *
         */
        checkIfSlugIsUnique: function()
        {
            app.slug.apiBaseUrl = app.generateBaseUrl() + '/admin/api/slug/checkIfSlugIsUnique/' + app.slug.slug;
            if ( app.slug.slug.length > 0 )
            {
                $.ajax({
                    'method': 'get',
                    'url': app.slug.apiBaseUrl,
                    'type': 'json'
                }).done( function( data ) {
                    app.slug.fillSlugField(data);
                } );
            }
        },

        /**
         * Fill in the slug field
         *
         * @param slug
         */
        fillSlugField: function( slug )
        {
            $('#slug')[0].value = slug;
        }
    },

    /**
     * Categories management for
     * within the form for creating
     * a post
     *
     */
    categories: {

        /**
         * Check if we have to call the listener
         *
         */
        init:function()
        {
            if ( $('#create-category').length ) app.categories.listener();
        },

        /**
         * Listen to a click on the add button
         *
         */
        listener: function()
        {
            $("#create-category").on('click', function(e)
            {
                e.preventDefault();
                app.categories.handle();
            });
        },

        /**
         * Handle a given category
         *
         */
        handle: function()
        {
            $('#cat-form').removeClass('has-error');
            $('#cat-errors').empty();

            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $("input[name='_token']")[0].value
                },
                method:     'post',
                url:        app.generateBaseUrl() + '/admin/categories',
                data:       { 'name': $('#newCategory')[0].value },
                dataType:   'json',
                success: function(data)
                {
                    $('#categories').prepend('<div class="row"><div class="col-sm-12"><label for="testje"><input checked="checked" name="category" type="radio" value="'+ data['hash'] +'"> '+ data['name'] +'</label></div></div>')
                    $('#newCategory')[0].value = '';
                },
                error: function(data)
                {
                    var errors = $('#cat-errors');
                    $('#cat-form').addClass('has-error');
                    errors.empty();
                    errors.append(data['responseJSON']['name'][0]);
                }
            });
        }

    },

    tags: {

        /**
         * Holds the added tags
         *
         */
        tags: [],

        /**
         * Check if we need to fill the tags array
         * and we have to start listening to the events
         *
         */
        init: function()
        {
            if ( $('#tag-btn').length )
            {
                app.tags.fillTagsArray();
                app.tags.listener();
                app.tags.tagDeleteListener();
            }
        },

        /**
         *
         * Start listening to a click on the
         * add button
         *
         */
        listener: function()
        {
            $('#tag-btn').on('click', function() {
                app.tags.handle();
            });
        },

        /**
         * Handle a click on the add button
         *
         */
        handle: function()
        {
            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $("input[name='_token']")[0].value
                },
                method:     'post',
                url:        app.generateBaseUrl() + '/admin/tags',
                data:       { 'tags': $('#newTags')[0].value },
                dataType:   'json',
                success: function(data)
                {
                    if ( ! data['passed'] ) return app.tags.errors(data);

                    return app.tags.appendData(data);
                }
            });
        },

        /**
         * Handle validation errors
         *
         * @param data
         */
        errors: function(data)
        {
            var tagErrors = $("#tag-errors");
            tagErrors.empty();
            for (var i = 0; i < data['messages'].length; i++)
            {
                tagErrors.append('<p>' + data['messages'][i][0] + '</p>')
            }
        },

        /**
         * Append added tags to the view
         *
         * @param data
         */
        appendData: function(data)
        {
            for ( var i = 0; i < data['tags'].length; i++ )
            {
                if ( $('.' + data['tags'][i].hash).length <= 0 )
                {
                    $('#tags').append('<span class="tag '+ data['tags'][i].hash +'"><a href="#" class="'+ data['tags'][i].hash +'" title="Remove tag"><span class="fa fa-times-circle"></span></a> ' + data['tags'][i].name + ' ');
                    app.tags.appendTagToForm(data['tags'][i].hash);
                }
            }
            $('#newTags')[0].value = '';
            app.tags.fillTagsArray();
            app.tags.tagDeleteListener();
        },

        /**
         * Fill the global tags array
         * with the tags of the current post
         *
         */
        fillTagsArray: function()
        {
            var tags = $('#tags');
            for ( var i = 0; i < tags[0].children.length; i++ )
            {
                app.tags.tags.push(tags[0].children[i].children[0]['attributes'][1].nodeValue);
            }
        },

        /**
         * Start listening on a click
         * on the delete icon of a single tag
         *
         */
        tagDeleteListener: function()
        {
            for ( var i = 0; i < app.tags.tags.length; i ++ )
            {
                $('.' + app.tags.tags[i]).on('click', function(e, i){
                    app.tags.deleteTag(e);
                } );
            }
        },

        /**
         * Delete a tag from the view
         *
         * @param e
         */
        deleteTag: function(e)
        {
            e.preventDefault();
            var hash = e.currentTarget.className;
            $('.' + hash).remove();

            app.tags.deleteTagsFromForm(hash);
        },

        /**
         * Append the hash of an added
         * tag to the input field so we
         * have the data availbale after
         * submitting the form
         *
         * @param hash
         */
        appendTagToForm: function( hash )
        {
            var field = $('#addedTags')[0];
            field.value += (field.value == '') ? hash : ',' + hash;
        },

        /**
         * Delete a tag from the input field
         * when we delete a tag
         *
         * @param hash
         */
        deleteTagsFromForm: function ( hash ) {
            var field = $('#addedTags')[0];
            var value = field.value;
            field.value = value.replace(hash, '');
            field.value = field.value.replace(/,,/g, ',');
            if (field.value.indexOf(',') === 0)  field.value = field.value.replace(/,/g, '');
        }

    },

    /**
     * Automatically save a post
     * with an interval of X minutes
     *
     */
    autoSave: {

        /**
         * Holds the auto save interval
         * in minutes
         *
         */
        interval: 1,

        /**
         * Holds the data that needs
         * to be auto saved
         *
         */
        data: {},

        /**
         * Define if we have to set an
         * interval and call the handler
         * or not
         *
         */
        init: function()
        {
            if ( $('#post').length )
            {
                setInterval(function() {
                    app.autoSave.fillDataObject();
                    app.autoSave.handler();
                }, 1000 * 60 * app.autoSave.interval );
            }
        },

        /**
         * Get the values of the input fields
         * and place them in the data object
         *
         */
        fillDataObject: function()
        {
            app.autoSave.data = {
                title: $('#title')[0].value,
                slug: $('#slug')[0].value,
                short_description: $('#short_description')[0].value,
                content: CKEDITOR.instances.post.getData(),
                status: $('#status')[0].value,
                visibility: $('#visibility')[0].value,
                publishdate: $('#publishdate')[0].value,
                reviewer: $('#reviewer')[0].value,
                category: $('#category')[0].value,
                tags: $('#addedTags')[0].value
            }
        },

        /**
         * Make the auto save request
         *
         */
        handler: function()
        {
            $.ajax({
                headers: {
                    'X-CSRF-TOKEN': $("input[name='_token']")[0].value
                },
                method:     'post',
                url:        app.generateBaseUrl() + '/admin/api/autosave/',
                data:       app.autoSave.data,
                dataType:   'json',
                success: function( response )
                {
                    if ( response[0] )
                    {
                        $('.auto-save-log').empty();
                        $('.auto-save-log').append('<p><span> Last saved on '+ response[1] +'</span></p>');
                    }
                    else
                    {
                        $('.auto-save-log').empty();
                        $('.auto-save-log').append('<p><span class="text-danger"> Faild to save on '+ response[1] +'</span></p>');
                    }
                }
            });
        }
    }

};

$(document.ready, app.init() );