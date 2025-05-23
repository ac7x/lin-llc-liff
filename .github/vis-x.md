timeline - vis.js - 一個動態、基於瀏覽器的視覺化函式庫。
Timeline
概述
Timeline 是一個互動式視覺化圖表，用於在時間軸上視覺化資料。
資料項目可以發生在單一天，或有開始與結束日期（區間）。
你可以透過拖曳與滾動自由移動與縮放 Timeline。
項目可以在 Timeline 中建立、編輯與刪除。
軸上的時間刻度會自動調整，並支援從毫秒到年等不同刻度。
Timeline 使用標準 HTML DOM 來呈現時間軸與其上的項目，這讓你可以透過 css 樣式彈性自訂。

目錄
- 概述
- 範例
- 載入
- 資料格式
  - 項目
  - 群組
- 設定選項
- 方法
- 事件
- 編輯項目
- 樣板
- 在地化
- 時區
- 樣式
範例

以下程式碼展示如何建立 Timeline 並提供資料。
更多範例可參考 timeline 範例頁面。

Timeline | Basic demo

Timeline 將附加的 DOM 元素

建立 DataSet（允許雙向資料繫結）

Timeline 設定

建立 Timeline

載入

請在你的專案子資料夾安裝或下載 vis.js 函式庫，並在 HTML 程式碼 head 中引入函式庫的 script 與 css 檔案：

Timeline 的建構子為 vis.Timeline

或當使用群組時：

建構子接受四個參數：
- container：要建立 timeline 的 DOM 元素。
- items：包含項目的陣列。項目的屬性請參考「資料格式，項目」章節。
- groups：包含群組的陣列。群組屬性請參考「資料格式，群組」章節。
- options：可選的物件，包含名稱與值的對應設定。也可透過 setOptions 方法設定。

資料格式

timeline 可提供兩種型態的資料：
- 項目：包含要在時間軸上顯示的項目集合。
- 群組：包含用於將項目分組的群組集合。

項目

對於項目，Timeline 可接受陣列、DataSet（提供雙向資料繫結）或 DataView（提供單向資料繫結）。
項目為一般物件，可包含下列屬性：start、end（可選）、content、group（可選）、className（可選）、editable（可選）、style（可選）。

DataSet 建立方式如下：

更多項目...

項目屬性說明如下：

名稱
型別
必填
說明

className
String
否
可選欄位。className 可用於給項目自訂 css 樣式。例如，當項目有 className 'red'，可定義如下 css 樣式：

更多樣式細節請參考「樣式」章節。

align
String
否
可選欄位。若設定此欄位，會覆蓋全域 align 設定。

content
String
是
項目內容，可為純文字或 HTML 程式碼。

end
Date 或 number 或 string 或 Moment
否
項目結束日期。可選，若有則顯示為區間，否則顯示為方塊。

group
任意型別
否
可選欄位。若提供 group 欄位，所有同 group 的項目會顯示在同一行，並顯示群組垂直軸。可用於顯示多個人員、房間或資源的可用性。

id
String 或 Number
否
項目 id。非必填但強烈建議。id 用於動態新增、更新、刪除 DataSet 項目。

selectable
Boolean
否
可針對特定項目啟用/停用可選性，預設為 true。不會覆蓋 timeline 的 selectable 設定。

start
Date 或 number 或 string 或 Moment
是
項目開始日期，例如 new Date(2010,9,23)。

style
String
否
自訂單一項目的 css 樣式字串，例如 "color: red; background-color: pink;"。

subgroup
String 或 Number
無
子群組 id。將同一群組內的項目依 subgroup 分組，並同高顯示而非堆疊。可透過 group 的 subgroupOrder 設定排序。

title
String
無
項目標題，滑鼠移至項目時顯示。可為 HTML 元素或含純文字/HTML 的字串。

type
String
否
項目型態，可為 'box'（預設）、'point'、'range' 或 'background'。'box' 與 'point' 需 start，'range' 與 'background' 需 start 與 end。

limitSize
Boolean
否
部分瀏覽器無法處理過大 DIV，預設會截斷超出可視範圍的 range DIV。設為 false 會建立完整大小的 DIV。

editable
Boolean 或 物件
否
覆蓋 timeline 的 editable 設定（假設 timeline.editable.overrideItems 為 false）。

editable.remove
boolean
否
若為 true，項目可被選取後點擊右上角刪除按鈕刪除。詳見「編輯項目」章節。

editable.updateGroup
boolean
否
若為 true，項目可從一群組拖曳到另一群組。僅適用於 Timeline 有群組時。詳見「編輯項目」章節。

editable.updateTime
boolean
否
若為 true，項目可拖曳至其他時間。詳見「編輯項目」章節。

Groups

For the items, groups can be an Array, a DataSet (offering 2 way data binding), or a DataView (offering 1 way data binding).

Using groups, items can be grouped together. Items are filtered per group, and displayed as

Group items can contain the properties id, content, and className (optional).

Groups can be applied to a timeline using the method setGroups or supplied in the constructor. A table with groups can be created like:

var groups = [
  {
    id: 1,
    content: 'Group 1'
    // Optional: a field 'className', 'style', 'order', [properties]
  }
  // more groups...
]);

Groups can have the following properties:

Name
Type
Required
Description

className
String
no
This field is optional. A className can be used to give groups an individual css style. For example, when a group has className 'red', one can define a css style .red { color: red; }. More details on how to style groups can be found in the section Styles.

content
String or Element
yes
The contents of the group. This can be plain text, html code or an html element.

id
String or Number
yes
An id for the group. The group will display all items having a property group which matches the id of the group.

style
String
no
A css text string to apply custom styling for an individual group label, for example "color: red; background-color: pink;".

subgroupOrder
String or Function
none
Order the subgroups by a field name or custom sort function. By default, groups are ordered by first-come, first-show.

subgroupStack
Object or Boolean
none
Enables stacking within individual subgroups. Example: {'subgroup0': true, 'subgroup1': false, 'subgroup2': true} For each subgroup where stacking is enabled, items will be stacked on top of each other within that subgroup such that they do no overlap. If set to true all subgroups will be stacked. If a value was specified for the order parameter in the options, that ordering will be used when stacking the items.

subgroupVisibility
Object
none
Ability to hide/show specific subgroups. Example: {'hiddenSubgroup0': false, 'subgroup1': true, 'subgroup2': true} If a subgroup is missing from the object, it will default as true (visible).

title
String
none
A title for the group, displayed when holding the mouse on the groups label. The title can only contain plain text.

visible
Boolean
no
Provides a means to toggle the whether a group is displayed or not. Defaults to true.

nestedGroups
Array
no
Array of group ids nested in the group. Nested groups will appear under this nesting group.

showNested
Boolean
no
Assuming the group has nested groups, this will set the initial state of the group - shown or collapsed. The showNested is defaulted to true.

Configuration Options

Options can be used to customize the timeline. Options are defined as a JSON 物件. All options are optional.

var options = {
  width: '100%',
  height: '30px',
  margin: {
    item: 20
  }
};

The following options are available.

Name
Type
Default
Description

align
String
'center'
Alignment of items with type 'box', 'range', and 'background'. Available values are 'auto' (default), 'center', 'left', or 'right'. For 'box' items, the 'auto' alignment is 'center'. For 'range' items, the auto alignment is dynamic: positioned left and shifted such that the contents is always visible on screen.

autoResize
boolean
true
If true, the Timeline will automatically detect when its container is resized, and redraw itself accordingly. If false, the Timeline can be forced to repaint after its container has been resized using the 函式 redraw().

clickToUse
boolean
false
When a Timeline is configured to be clickToUse, it will react to mouse and touch events only when active. When active, a blue shadow border is displayed around the Timeline. The Timeline is set active by clicking on it, and is changed to inactive again by clicking outside the Timeline or by pressing the ESC key.

configure
boolean or 函式
false
When true, a configurator is loaded where all configuration options of the Timeline can be changed live.

The displayed options can be filtered by providing a filter 函式. This 函式 is invoked with two arguments: the current option and the path (an Array) of the option within the options 物件. The option will be displayed when the filter 函式 returns true. For example to only display format options:
function (option, path) {
  return option === 'format' || path.indexOf('format') !== -1;
}

dataAttributes
string[] or 'all'
false
An array of fields optionally defined on the timeline items that will be appended as data- attributes to the DOM element of the items. If value is 'all' then each field defined on the timeline item will become a data- attribute.

editable
boolean or 物件
false
If true, the items in the timeline can be manipulated. Only applicable when option selectable is true. See also the callbacks onAdd, onUpdate, onMove, and onRemove. When editable is an 物件, one can enable or disable individual manipulation actions. See section Editing Items for a detailed explanation.

editable.add
boolean
false
If true, new items can be 建立 by double tapping an empty space in the Timeline. See section Editing Items for a detailed explanation.

editable.remove
boolean
false
If true, items can be deleted by first selecting them, and then clicking the delete button on the top right of the item. See section Editing Items for a detailed explanation.

editable.updateGroup
boolean
false
If true, items can be dragged from one group to another. Only applicable when the Timeline has groups. See section Editing Items for a detailed explanation.

editable.updateTime
boolean
false
If true, items can be dragged to another moment in time. See section Editing Items for a detailed explanation.

editable.overrideItems
boolean
false
If true, item specific editable properties are overridden by timeline settings

end
Date or Number or String or Moment
none
The initial end date for the axis of the timeline. If not provided, the latest date present in the items set is taken as end date.

format
物件 or 函式
none
Apply custom date formatting of the labels on the time axis. The default value of format is:
{
  minorLabels: {
    millisecond:'SSS',
    second:     's',
    minute:     'HH:mm',
    hour:       'HH:mm',
    weekday:    'ddd D',
    day:        'D',
    week:       'w',
    month:      'MMM',
    year:       'YYYY'
  },
  majorLabels: {
    millisecond:'HH:mm:ss',
    second:     'D MMMM HH:mm',
    minute:     'ddd D MMMM',
    hour:       'ddd D MMMM',
    weekday:    'MMMM YYYY',
    day:        'MMMM YYYY',
    week:       'MMMM YYYY',
    month:      'YYYY',
    year:       ''
  }
}

For values which not provided in the customized options.format, the default values will be used. All available formatting syntax is described in the docs of moment.js.

You can also use a 函式 format for each label. The 函式 accepts as arguments the date, scale and step in that order, and expects to return a string for the label.

function format({
  minorLabels: 函式(date: Date, scale: Number, step: Number),
  majorLabels: 函式(date: Date, scale: Number, step: Number)
})

groupEditable
boolean or Object
false
If true, the groups in the timeline can be manipulated. See also the callbacks onAddGroup, onMoveGroup, and onRemoveGroup. When groupEditable is an object, one can enable or disable individual manipulation actions.
The editing of groups follows the same principles as for items, see section Editing Items for a detailed explanation.

groupEditable.add
boolean
false
If true, new groups can be created in the Timeline. For now adding new groups is done by the user.

groupEditable.remove
boolean
false
If true, groups can be deleted. For now removing groups is done by the user.

groupEditable.order
boolean
false
If true, groups can be dragged to change their order. Only applicable when the Timeline has groups. For this option to work properly the groupOrder and groupOrderSwap options have to be set as well.

groupHeightMode
String
'auto'
Specifies how the height of a group is calculated. Choose from 'auto','fixed', and 'fitItems'.
If it is set to 'auto' the height will be calculated based on a group label and visible items.
If it is set to 'fitItems' the height will be calculated based on the visible items only.
While if it is set to 'fixed' the group will keep the same height even if there are no visible items in the window.

groupOrder
String or Function
'order'
Order the groups by a field name or custom sort function.
By default, groups are ordered by a property order (if set).
If no order properties are provided, the order will be undetermined.

groupOrderSwap
Function
none
Swaps the positions of two groups. If groups have a custom order (via groupOrder) and groups are configured to be reorderable (via groupEditable.order), the user has to provide a function that swaps the positions of two given groups.
If this option is not set, the default implementation assumes that groups hold an attribute order which values are changed. The signature of the groupOrderWap function is:
function groupOrderSwap(fromGroup: Object, toGroup: Object, groups: DataSet)
The first to arguments hold the groups of which the positions are to be swapped and the third argument holds the DataSet with all groups.

groupTemplate
function
none
A template function used to generate the contents of the groups. The function is called by the Timeline with a groups data as the first argument and the group element as the second, and must return HTML code, a string or a template as result. When the option groupTemplate is specified, the groups do not need to have a field content. See section Templates for a detailed explanation.

height
number or String
none
The height of the timeline in pixels or as a percentage.
When height is undefined or null, the height of the timeline is automatically
adjusted to fit the contents.
It is possible to set a maximum height using option maxHeight
to prevent the timeline from getting too high in case of automatically
calculated height.

hiddenDates
Object
none
This option allows you to hide specific timespans from the time axis. The dates can be supplied as an object:
{start: '2014-03-21 00:00:00', end: '2014-03-28 00:00:00', [repeat:'daily']} or as an Array of these objects. The repeat argument is optional.
The possible values are (case-sensitive): daily, weekly, monthly, yearly. To hide a weekend, pick any Saturday as start and the following Monday as end
and set repeat to weekly.

horizontalScroll
Boolean
false
This option allows you to scroll horizontally to move backwards and forwards in the time range.
Only applicable when option zoomKey is defined or zoomable is false.

itemsAlwaysDraggable
boolean or Object
Object
When a boolean, applies the value only to itemsAlwaysDraggable.item.

itemsAlwaysDraggable.item
boolean
false
If true, all items in the Timeline are draggable without being selected. If false, only the selected item(s) are draggable.

itemsAlwaysDraggable.range
boolean
false
If true, range of all items in the Timeline is draggable without being selected. If false, range is only draggable for the selected item(s). Only applicable when option itemsAlwaysDraggable.item is set true.

locale
String
none
Select a locale for the Timeline. See section Localization for more information.

locales
Object
none
A map with i18n locales. See section Localization for more information.

longSelectPressTime
number
251
The minimal press time in ms for an event to be considered a (long) press.

moment
function
vis.moment
A constructor for creating a moment.js Date. Allows for applying a custom time zone. See section Time zone for more information.

margin
number or Object
Object
When a number, applies the margin to margin.axis, margin.item.horizontal, and margin.item.vertical.

margin.axis
number
20
The minimal margin in pixels between items and the time axis.

margin.item
number
10
The minimal margin in pixels between items in both horizontal and vertical direction.

margin.item.horizontal
number
10
The minimal horizontal margin in pixels between items.

margin.item.vertical
number
10
The minimal vertical margin in pixels between items.

max
Date or Number or String or Moment
none
Set a maximum Date for the visible range.
It will not be possible to move beyond this maximum.

maxHeight
number or String
none
Specifies the maximum height for the Timeline. Can be a number in pixels or a string like "300px".

maxMinorChars
number
7
Specifies the maximum number of characters that should fit in minor grid labels.
If larger, less and wider grids will be drawn.

min
Date or Number or String or Moment
none
Set a minimum Date for the visible range.
It will not be possible to move beyond this minimum.

minHeight
number or String
none
Specifies the minimum height for the Timeline. Can be a number in pixels or a string like "300px".

moveable
boolean
true
Specifies whether the Timeline can be moved and zoomed by dragging the window.
See also option zoomable.

multiselect
boolean
false
If true, multiple items can be selected using ctrl+click, shift+click, or by holding items.
Only applicable when option selectable is true.

multiselectPerGroup
boolean
false
If true, selecting multiple items using shift+click will only select items residing in the same group as the first selected item.
Only applicable when option selectable and multiselect are true.

onAdd
function
none
Callback function triggered when an item is about to be added: when the user double taps an empty space in the Timeline. See section Editing Items for more information. Only applicable when both options selectable and editable.add are set true.

onAddGroup
function
none
Callback function triggered when a group is about to be added. The signature and semantics are the same as for onAdd.

onDropObjectOnItem
function
none
Callback function triggered when an object containing target:'item' in its drag data is dropped in to a timeline item.

onInitialDrawComplete
function
none
Callback function triggered when the timeline is initially drawn. This function fires once per timeline creation.

onMove
function
none
Callback function triggered when an item has been moved: after the user has dragged the item to an other position. See section Editing Items for more information. Only applicable when both options selectable and editable.updateTime or editable.updateGroup are set true.

onMoveGroup
function
none
Callback function triggered when a group has been moved: after the user has dragged the group to an other position. The signature and semantics are the same as for onMove.

onMoving
function
none
Callback function triggered repeatedly when an item is being moved. See section Editing Items for more information. Only applicable when both options selectable and editable.updateTime or editable.updateGroup are set true.

onRemove
function
none
Callback function triggered when an item is about to be removed: when the user tapped the delete button on the top right of a selected item. See section Editing Items for more information. Only applicable when both options selectable and editable.remove are set true.

onRemoveGroup
function
none
Callback function triggered when a group is about to be removed. The signature and semantics are the same as for onRemove.

onUpdate
function
none
Callback function triggered when an item is about to be updated, when the user double taps an item in the Timeline. See section Editing Items for more information. Only applicable when both options selectable and editable.updateTime or editable.updateGroup are set true.

order
function
none
Provide a custom sort function to order the items. The order of the
items is determining the way they are stacked. The function
order is called with two arguments containing the data of two items to be
compared.
WARNING: Use with caution. Custom ordering is not suitable for large amounts of items. On load, the Timeline will render all items once to determine their width and height. Keep the number of items in this configuration limited to a maximum of a few hundred items.

orientation
String or Object
'bottom'
Orientation of the timelines axis and items. When orientation is a string, the value is applied to both items and axis. Can be 'top', 'bottom' (default), 'both', or 'none'.

orientation.axis
String
'bottom'
Orientation of the timeline axis: 'top', 'bottom' (default), 'both', or 'none'. If orientation is 'bottom', the time axis is drawn at the bottom. When 'top', the axis is drawn on top. When 'both', two axes are drawn, both on top and at the bottom. In case of 'none', no axis is drawn at all.

orientation.item
String
'bottom'
Orientation of the timeline items: 'top' or 'bottom' (default). Determines whether items are aligned to the top or bottom of the Timeline.

preferZoom
boolean
false
If true, scrolling vertically on timeline center panel will be prevented, and zoom action will be preferred, without need of zoomKey.

rollingMode
Object
Object
Specify how the timeline implements rolling mode.

rollingMode.follow
boolean
false
If true, the timeline will initial in a rolling mode - the current time will always be centered. I the user drags the timeline, the timeline will go out of rolling mode and a toggle button will appear. Clicking that button will go back to rolling mode. Zooming in rolling mode will zoom in to the center without consideration of the mouse position.

rollingMode.offset
Number
'0.5'
Set how far from the left the rolling mode is implemented from. A percentage (i.e. a decimal between 0 and 1)
Defaults to the middle or 0.5 (50%)

rtl
boolean
false
If true, the timeline will be right-to-left. Note: you can achieve rtl timeline by defining a parent node with dir="rtl". The timeline knows to take the nearest parent node direction and apply it. Notice that the timeline will prefer the option.rtl over any parent dir="rtl"

selectable
boolean
true
If true, the items on the timeline can be selected. Multiple items can be selected by long pressing them, or by using ctrl+click or shift+click. The event select is fired each time the selection has changed (see section Events).

sequentialSelection
boolean
false
If true, then only sequential items are allowed to be selected (no gaps) when multiselect is true

showCurrentTime
boolean
true
Show a vertical bar at the current time.

showMajorLabels
boolean
true
By default, the timeline shows both minor and major date labels on the
time axis.
For example the minor labels show minutes and the major labels show hours.
When showMajorLabels is false, no major labels
are shown.

showMinorLabels
boolean
true
By default, the timeline shows both minor and major date labels on the
time axis.
For example the minor labels show minutes and the major labels show hours.
When showMinorLabels is false, no minor labels
are shown. When both showMajorLabels and
showMinorLabels are false, no horizontal axis will be
visible.

showWeekScale
boolean
false
By default, the timeline doesn't show week number scale in the date labels on the
time axis.
When showWeekScale is true, week number labels
are shown.

showTooltips
boolean
true
如果為 true，具有標題的項目會顯示工具提示。若為 false，則不顯示項目工具提示。

stack
boolean
true
如果為 true（預設），項目會堆疊在彼此之上以避免重疊。

stackSubgroups
boolean
true
如果為 true（預設），子群組會堆疊在彼此之上以避免重疊。

cluster
Object 或 boolean
false
如果為 true，重疊的項目會被分組為叢集，縮放時會改變分組。當需要顯示大量項目時請使用此選項。

cluster.maxItems
number 或 null
1
重疊的項目在數量達到 maxItems 前不會被分組。maxItems 預設值為 1，代表每兩個重疊項目就會被分群。

cluster.titleTemplate
string 或 null
none
叢集項目的工具提示，會以項目數量取代 {count}。

cluster.clusterCriteria
function 或 null
() => true
若指定，決定重疊項目是否進入同一叢集。clusterCriteria 函式簽章為：function clusterCriteria(firstItem: 物件, secondItem: 物件): boolean。

cluster.showStipes
boolean
false
若為 true，當內容溢出時會顯示從叢集到時間軸的線條。

cluster.fitOnDoubleClick
boolean
true
若為 true，雙擊時會將叢集置中。

snap
function 或 null
function
在 Timeline 上移動項目時，會自動對齊到適合的日期（如整點或整天），依據目前縮放比例。snap 函式可自訂，或設為 null 以停用。函式簽章為：function snap(date: Date, scale: string, step: number): Date 或 number。scale 可能為 'millisecond', 'second', 'minute', 'hour', 'weekday', 'week', 'day', 'month', 'year'。step 為數字如 1, 2, 4, 5。

start
Date 或 Number 或 String 或 Moment
none
時間軸的初始開始日期。若未提供，則取事件中最早的日期。

template
function
none
用於產生項目內容的模板函式。Timeline 會以項目資料為第一參數、項目元素為第二參數、編輯資料為第三參數呼叫此函式，必須回傳 HTML 程式碼、字串或模板。指定 template 選項時，項目不需 content 欄位。詳見「模板」章節。

visibleFrameTemplate
function
none
用於產生項目可見框架的模板函式。Timeline 會以項目資料為第一參數、項目框架元素為第二參數呼叫，必須回傳 HTML 程式碼、字串或模板。指定 template 選項時，項目不需 content 欄位。可用於在項目可見框架內加入固定大小內容，不會被 vis-item-overflow（overflow:hidden）隱藏。

timeAxis
Object
Object
指定時間軸的固定縮放比例與步長。

timeAxis.scale
String
none
設定 Timeline 時間軸的固定縮放比例。可選 'millisecond', 'second', 'minute', 'hour', 'weekday', 'week', 'day', 'month', 'year'。範例：var options = { timeAxis: {scale: 'minute', step: 5} }。注意：'week' 僅在啟用在地化時正常運作。

timeAxis.step
number
1
設定時間軸的固定步長。僅在與 timeAxis.scale 一起使用時適用。可選 1, 2, 5, 10 等。

type
String
none
指定時間軸項目的預設型別。可選 'box', 'point', 'range', 'background'。個別項目可覆寫此預設型別。若未定義，Timeline 會自動偵測：若有 start 與 end 日期則建立 'range'，否則建立 'box'。'background' 型別項目不可編輯。

tooltip
Object
Object
指定工具提示的位置設定。

tooltip.followMouse
boolean
false
若為 true，工具提示會隨滑鼠在項目內移動。

tooltip.overflowMethod
String
'flip'
設定工具提示即將超出時間軸時的行為。可選 'cap'、'flip'、'none'。'cap' 會將位置限制在時間軸內；'flip' 會將工具提示位置翻轉，使其可見；'none' 則不限制，可能導致部分工具提示被隱藏或超出時間軸。

tooltip.delay
Number
500
設定工具提示顯示前的延遲（毫秒）。

tooltip.template
Function
none
用於產生工具提示內容的模板函式。Timeline 會以項目資料為第一參數、編輯資料為第二參數呼叫，必須回傳 HTML 程式碼、字串或模板。詳見「模板」章節。另見 tooltipOnItemUpdateTime.template。

tooltipOnItemUpdateTime
Object/Boolean
false
在更新項目時間時顯示工具提示。注意：editable.updateTime 必須為 true。

tooltipOnItemUpdateTime.template
Function
none
用於產生工具提示內容的模板函式。Timeline 會以項目資料為第一參數呼叫，必須回傳 HTML 程式碼、字串或模板。詳見「模板」章節。另見 tooltip.template。

verticalScroll
Boolean
false
在群組清單側邊顯示垂直捲軸，並於未觸發縮放時連結至捲動事件。設為 true 不會覆寫 horizontalScroll。捲動事件會忽略垂直方向，但會顯示垂直捲軸。

width
String 或 Number
'100%'
時間軸寬度（像素或百分比）。

xss
Object
none
設定 Timeline 的 XSS 防護行為，預設總是啟用。大多數屬性與 HTML 元素會在輸出前移除或轉義。

xss.disabled
Boolean
undefined
明確設為 true 可完全停用 Timeline 的 XSS 防護。注意：請自行安裝 XSS 防護措施！

xss.filterOptions
IFilterXSSOptions
undefined
可自訂允許的 HTML 元素、屬性與處理函式。詳見 js-xss 函式庫與相關型別文件。

zoomable
boolean
true
指定 Timeline 是否可透過捏合或滾動縮放。僅在 moveable 為 true 時適用。

zoomFriction
number
5
指定每次滾動縮放的強度。數值越高縮放速度越慢。

zoomKey
String
''
指定 Timeline 僅在額外按鍵按下時才可縮放。可選 ''（不限制）、'altKey'、'ctrlKey'、'shiftKey'、'metaKey'。僅在 moveable 為 true 時適用。

zoomMax
number
315360000000000
設定可見範圍的最大縮放間隔（毫秒）。無法再放大超過此值。預設約等於 10000 年。

zoomMin
number
10
設定可見範圍的最小縮放間隔（毫秒）。無法再縮小超過此值。

方法

Timeline 支援以下方法。

方法
回傳型別
說明

addCustomTime([time] [, id])
number 或 String
新增可由使用者拖曳的自訂時間垂直線。time 可為 Date、Number 或 String，預設為 new Date()。id 可為 Number 或 String，預設為 undefined。id 會加為自訂時間線的 CSS 類別名稱，可用於不同樣式。方法會回傳建立的線條 id。

destroy()
none
銷毀 Timeline。會從記憶體移除，並清除所有 DOM 元素與事件監聽器。

fit([options])
none
調整可見視窗以符合所有項目。另見 focus(id)。可用選項：animation: boolean 或 {duration: number, easingFunction: string}。若為 true（預設）或物件，則平滑動畫至新視窗。物件可指定 duration 與 easingFunction。預設 duration 為 500 ms，easingFunction 為 'easeInOutQuad'。可用 easingFunction：linear、easeInQuad、easeOutQuad、easeInOutQuad、easeInCubic、easeOutCubic、easeInOutCubic、easeInQuart、easeOutQuart、easeInOutQuart、easeInQuint、easeOutQuint、easeInOutQuint。

focus(id 或 ids [, options])
none
調整可見視窗，將選定項目（或多個項目）置中。另見 fit()。可用選項：animation: boolean 或 {duration: number, easingFunction: string}（同上）；zoom: boolean，若為 true（預設），則聚焦後自動縮放。

getCurrentTime()
Date
取得目前時間。僅在 showCurrentTime 為 true 時適用。

getCustomTime([id])
Date
取得指定 id 的自訂時間線時間。id 預設為 undefined。

getEventProperties(event)
物件
回傳事件的相關屬性：
group（Number 或 null）：點擊群組的 id。
item（Number 或 null）：點擊項目的 id。
customTime（Number 或 null）：點擊自訂時間的 id。
pageX（Number）：點擊事件的絕對水平座標。
pageY（Number）：點擊事件的絕對垂直座標。
x（Number）：點擊事件的相對水平座標。
y（Number）：點擊事件的相對垂直座標。
time（Date）：點擊事件的日期。
snappedTime（Date）：對齊後的點擊事件日期。
what（String 或 null）：點擊項目的名稱：item、background、axis、group-label、custom-time、current-time。
event（物件）：原始點擊事件。
範例用法：
document.getElementById('myTimeline').onclick = function (event) {
  var props = timeline.getEventProperties(event)
  console.log(props);
}

getItemRange()
Object
取得所有項目的範圍，作為一個包含 min: Date 和 max: Date 的物件。

getSelection()
number[]
取得目前選取的項目 ID 陣列。

getVisibleItems()
number[]
取得目前可見的項目 ID 陣列。

getWindow()
Object
取得目前可見的時間範圍。返回一個具有 start: Date 和 end: Date 屬性的物件。

moveTo(time [, options, callback])
none
移動時間範圍，使指定的時間位於視窗中央。參數 time 可以是 Date、Number 或 String。可用的選項：
animation: boolean or {duration: number, easingFunction: string}
如果為 true（預設值）或物件，則範圍將平滑動畫到新視窗。可以提供物件來指定持續時間和緩動函數。預設持續時間為 500 毫秒，預設緩動函數為 'easeInOutQuad'。可用的緩動函數有： "linear"、 "easeInQuad"、 "easeOutQuad"、 "easeInOutQuad"、 "easeInCubic"、 "easeOutCubic"、 "easeInOutCubic"、 "easeInQuart"、 "easeOutQuart"、 "easeInOutQuart"、 "easeInQuint"、 "easeOutQuint"、 "easeInOutQuint"。
可以選擇性地傳遞一個回呼 function 作為參數。此函數將在 moveTo 函數結束時被調用。

on(event, callback)
none
建立事件監聽器。每當事件被觸發時，回呼函數將被調用。可用的事件有： rangechange、 rangechanged、 select、 itemover、 itemout。回呼函數的調用方式為 callback(properties)，其中 properties 是一個包含事件特定屬性的物件。詳情請參見 #Events 區段。

off(event, callback)
none
移除先前透過 on(event, callback) 函數建立的事件監聽器。詳情請參見 #Events 區段。

redraw()
none
強制重新繪製時間軸。所有項目的大小將被重新計算。
當選項 autoResize=false 且視窗已被調整大小時，或者當項目的 CSS 已被更改時，這可能很有用。

removeCustomTime(id)
none
移除先前透過 addCustomTime 方法添加到時間軸的垂直線。參數 id 是透過 addCustomTime 方法返回的自定義垂直線的 ID。

setCurrentTime(time)
none
設定當前時間。這可以用來確保客戶端的時間與共享的伺服器時間同步。
time 可以是日期物件、數字時間戳或 ISO 日期字串。
只有在選項 showCurrentTime 為 true 時才適用。

setCustomTime(time [, id])
none
調整自定義時間條的時間。
參數 time 可以是日期物件、數字時間戳或 ISO 日期字串。
參數 id 是自定義時間條的 ID，預設為 undefined。

setCustomTimeMarker(title [, id, editable])
none
將標記附加到自定義時間條。
參數 title 是要設置為標記標題的字串。
參數 id 是自定義時間條的 ID，預設為 undefined。
任何標記的樣式都可以透過指定 CSS 選擇器來覆蓋，例如 .vis-custom-time > .vis-custom-time-marker、 .${The id of the custom time bar} > .vis-custom-time-marker。
參數 editable 使標記可編輯（如果為 true），預設為 false。

setCustomTimeTitle(title [, id])
none
調整自定義時間條的標題屬性。
參數 title 是要設置為標題的字串或函數。使用空字串可完全隱藏標題。
參數 id 是自定義時間條的 ID，預設為 undefined。

setData({
  groups: groups,
  items: items
})
none
同時設置群組和項目。兩個屬性都是可選的。這是一個方便的方法，用於分別調用 setItems(items) 和 setGroups(groups)。
items 和 groups 都可以是包含物件的陣列、
提供雙向數據綁定的 DataSet，或提供單向數據綁定的 DataView。
對於每個群組，時間軸的項目會根據
屬性 group 進行過濾，該屬性必須與該群組的 ID 相對應。

setGroups(groups)
none
為時間軸設置一個群組數據集。
groups 可以是包含物件的陣列、
提供雙向數據綁定的 DataSet，或提供單向數據綁定的 DataView。
對於每個群組，時間軸的項目會根據
屬性 group 進行過濾，該屬性必須與該群組的 ID 相對應。

setItems(items)
none
為時間軸設置一個項目數據集。
items 可以是包含物件的陣列、
提供雙向數據綁定的 DataSet，或提供單向數據綁定的 DataView。

setOptions(options)
none
設置或更新選項。可以隨時更改時間軸的任何選項。例如，您可以隨時切換方向。

setSelection(id or ids [, options])
none
通過 ID 選擇一個或多個項目。當前選定的項目將被取消選擇。要取消選擇所有選定的項目，請調用 `setSelection([])`。可用的選項：
focus: boolean
如果為 true，則將焦點設置為所選項目
animation: boolean or {duration: number, easingFunction: string}
如果為 true（預設值）或物件，則範圍將平滑動畫到新視窗。可以提供物件來指定持續時間和緩動函數。預設持續時間為 500 毫秒，預設緩動函數為 'easeInOutQuad'。僅在焦點選項為 true 時適用。可用的緩動函數有： "linear"、 "easeInQuad"、 "easeOutQuad"、 "easeInOutQuad"、 "easeInCubic"、 "easeOutCubic"、 "easeInOutCubic"、 "easeInQuart"、 "easeOutQuart"、 "easeInOutQuart"、 "easeInQuint"、 "easeOutQuint"、 "easeInOutQuint"。

setWindow(start, end [, options, callback])
none
設置當前可見的時間範圍。參數 start 和 end 可以是 Date、Number 或 String。如果參數 start 或 end 的值為 null，則該參數將保持不變。可用的選項：
animation: boolean or {duration: number, easingFunction: string}
如果為 true（預設值）或物件，則範圍將平滑動畫到新視窗。可以提供物件來指定持續時間和緩動函數。預設持續時間為 500 毫秒，預設緩動函數為 'easeInOutQuad'。可用的緩動函數有： "linear"、 "easeInQuad"、 "easeOutQuad"、 "easeInOutQuad"、 "easeInCubic"、 "easeOutCubic"、 "easeInOutCubic"、 "easeInQuart"、 "easeOutQuart"、 "easeInOutQuart"、 "easeInQuint"、 "easeOutQuint"、 "easeInOutQuint"。
可以選擇性地傳遞一個回呼 function 作為參數。此函數將在 setWindow 函數結束時被調用。

toggleRollingMode()
none
切換滾動模式。

zoomIn(percentage [, options, callback])
none
放大當前可見的時間範圍。參數 percentage 可以是 Number，範圍必須在 0 和 1 之間。如果參數 percentage 的值為 null，則視窗將保持不變。可用的選項：
animation: boolean or {duration: number, easingFunction: string}
如果為 true（預設值）或物件，則範圍將平滑動畫到新視窗。可以提供物件來指定持續時間和緩動函數。預設持續時間為 500 毫秒，預設緩動函數為 'easeInOutQuad'。可用的緩動函數有： "linear"、 "easeInQuad"、 "easeOutQuad"、 "easeInOutQuad"、 "easeInCubic"、 "easeOutCubic"、 "easeInOutCubic"、 "easeInQuart"、 "easeOutQuart"、 "easeInOutQuart"、 "easeInQuint"、 "easeOutQuint"、 "easeInOutQuint"。
可以選擇性地傳遞一個回呼 function 作為參數。此函數將在 zoomIn 函數結束時被調用。

zoomOut(percentage [, options, callback])
none
縮小當前可見的時間範圍。參數 percentage 可以是 Number，範圍必須在 0 和 1 之間。如果參數 percentage 的值為 null，則視窗將保持不變。可用的選項：
animation: boolean or {duration: number, easingFunction: string}
If true (default) or an Object, the range is animated smoothly to the new window. An object can be provided to specify duration and easing function. Default duration is 500 ms, and default easing function is 'easeInOutQuad'. Available easing functions: "linear", "easeInQuad", "easeOutQuad", "easeInOutQuad", "easeInCubic", "easeOutCubic", "easeInOutCubic", "easeInQuart", "easeOutQuart", "easeInOutQuart", "easeInQuint", "easeOutQuint", "easeInOutQuint".
A callback function can be passed as an optional parameter. This function will be called at the end of zoomOut function.

Events

Timeline fires events when changing the visible window by dragging, when
selecting items, and when dragging the custom time bar.

Here an example on how to listen for a select event.

timeline.on('select', function (properties) {
  alert('selected items: ' + properties.items);
});

A listener can be removed via the function off:

function onSelect (properties) {
  alert('selected items: ' + properties.items);
}

timeline.on('select', onSelect);

timeline.off('select', onSelect);

The following events are available.

Name
Properties
Description

currentTimeTick
Fired when the current time bar redraws. The rate depends on the zoom level.

click
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when clicked inside the Timeline.

contextmenu
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when right-clicked inside the Timeline. Note that in order to prevent the context menu from showing up, default behavior of the event must be stopped:
timeline.on('contextmenu', function (props) {
  alert('Right click!');
  props.event.preventDefault();
});

doubleClick
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when double clicked inside the Timeline.

dragover
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when dragging over a timeline element.

drop
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when dropping inside the Timeline.

mouseOver
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when the mouse hovers over a timeline element.

mouseDown
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when the mouse down event is triggered over a timeline element.

mouseUp
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when the mouse up event is triggered over a timeline element.

mouseMove
Passes a properties object as returned by the method Timeline.getEventProperties(event).
Fired when the mouse is moved over a timeline element.

groupDragged
Passes the id of the dragged group.
Fired after the dragging of a group is finished.

changed
Has no properties.
Fired once after each graph redraw.

rangechange
start (Number): timestamp of the current start of the window.
end (Number): timestamp of the current end of the window.
byUser (Boolean): change happened because of user drag/zoom.
event (Object): original event triggering the rangechange.
Fired repeatedly when the timeline window is being changed.

rangechanged
start (Number): timestamp of the current start of the window.
end (Number): timestamp of the current end of the window.
byUser (Boolean): change happened because of user drag/zoom.
event (Object): original event triggering the rangechanged.
Fired once after the timeline window has been changed.

select
items: an array with the ids of the selected items
event: the original click event
Fired after the user selects or deselects items by tapping or holding them.
When a user taps an already selected item, the select event is fired again.
Not fired when the method setSelection is executed.

itemover
item: hovered item id
event: the original mouseover event
Fired when the user moves the mouse over an item.

itemout
item: hovered item id
event: the original mouseout event
Fired when the user moves the mouse out of an item.

timechange
id (Number or String): custom time bar id.
time (Date): the custom time.
event (Object): original event triggering the timechange.
Fired repeatedly when the user is dragging the custom time bar.
Only available when the custom time bar is enabled.

timechanged
id (Number or String): custom time bar id.
time (Date): the custom time.
event (Object): original event triggering the timechanged.
Fired once after the user has dragged the custom time bar.
Only available when the custom time bar is enabled.

markerchange
id (Number or String): custom time bar id which the marker is attached to.
title (Date): the marker title.
event (Object): original event triggering the markerchange.
Fired when the marker title has been changed.
Only available when the marker is editable.

markerchanged
id (Number or String): custom time bar id which the marker is attached to.
title (Date): the marker title.
event (Object): original event triggering the markerchanged.
Fired when an alteration to the marker title is committed.
Only available when the marker is editable.

Editing Items

When the Timeline is configured to be editable (both options selectable and editable are true), the user can:
Select an item by clicking it, and use ctrl+click to or shift+click to select multiple items (when multiselect: true).
Move selected items by dragging them.
Create a new item by double tapping on an empty space.
Create a new range item by dragging on an empty space with the ctrl key down.
Update an item by double tapping it.
Delete a selected item by clicking the delete button on the top right.

Option editable accepts a boolean or an object. When editable is a boolean, all manipulation actions will be either enabled or disabled. When editable is an object, one can enable individual manipulation actions:

// enable or disable all manipulation actions
var options = {
  editable: true       // true or false
};

// enable or disable individual manipulation actions
var options = {
  editable: {
    add: true,         // add new items by double tapping
    updateTime: true,  // drag items horizontally
    updateGroup: true, // drag items from one group to another
    remove: true,       // delete an item by tapping the delete button top right
    overrideItems: false  // allow these options to override item.editable
  }
};

Editing can be enabled/disabled for specific items. Setting the property editable to true or false on a data item will override the timeline option except when timeline.editable.overrideItems is set to true.

Individual manipulation actions (updateTime, updateGroup and remove) can also be set on individual items. If any of the item-level actions are specified (and overrideItems is not false) then that takes precedence over the settings at the timeline level. Current behavior is that if any of the item-level actions are not specified, those items get undefined value (rather than inheriting from the timeline level). This may change in future major releases, and code that specifies all item level values will handle major release changes better. That is, instead of using editable: {updateTime : true}, use editable: {updateTime : true, updateGroup: false, remove: false}.

One can specify callback functions to validate changes made by the user. There are a number of callback functions for this purpose:

onAdd(item, callback) Fired when a new item is about to be added. If not implemented, the item will be added with default text contents.
onUpdate(item, callback) Fired when an item is about to be updated. This function typically has to show a dialog where the user change the item. If not implemented, nothing happens.
onDropObjectOnItem(objectData, item) Fired when an object is dropped in to an existing timeline item.
onMove(item, callback) Fired when an item has been moved. If not implemented, the move action will be accepted.
onMoving(item, callback) Fired repeatedly while an item is being moved (dragged). Can be used to adjust the items start, end, and/or group to allowed regions.
onRemove(item, callback) Fired when an item is about to be deleted. If not implemented, the item will be always removed.

Each of the callbacks is invoked with two arguments:

item: the item being manipulated
callback: a callback function which must be invoked to report back. The callback must be invoked as callback(item) or callback(null). Here, item can contain changes to the passed item. Parameter item typically contains fields content, start, and optionally end. The type of start and end is determined by the DataSet type configuration and is Date by default. When invoked as callback(null), the action will be cancelled.

Templates

Timeline supports templates to format item contents. Any template engine (such as handlebars or mustache) can be used, and one can also manually build HTML. In the options, one can provide a template handler. This handler is a function accepting an item's data as the first argument, the item element as the second argument and the edited data as the third argument, and outputs formatted HTML:

Create HTML manually

The HTML for an item can be created manually.

Using a template engine

Using handlebars, one can write the template in HTML.

Compile the template.

And then specify the template in the Timeline options.

React templates

You can use a React component for the templates by rendering them to the templates' element directly.

Multiple templates

In order to support multiple templates, the template handler can be extended to switch between different templates, depending on a specific item property.

Now the items can be extended with a property template, specifying which template to use for the item.

Localization

Timeline can be localized. For localization, Timeline depends largely on the localization of moment.js. Locales are not included in vis.js by default. To enable localization, moment.js must be loaded with locales. Moment.js offers a bundle named "moment-with-locales.min.js" for this and there are various alternative ways to load locales.

To set a locale for the Timeline, specify the option locale.

Create a new locale

To load a locale (that is not supported by default) into the Timeline, one can add a new locale to the option locales.

Available locales

Timeline comes with support for the following locales:

Language: English, Code: en, en_EN, en_US  
Language: Italian, Code: it, it_IT, it_CH  
Language: Dutch, Code: nl, nl_NL, nl_BE  
Language: German, Code: de, de_DE  
Language: French, Code: fr, fr_FR, fr_CA, fr_BE  
Language: Ukrainian, Code: uk, uk_UA  
Language: Russian, Code: ru, ru_RU  
Language: Polish, Code: pl, pl_PL  
Language: Portuguese, Code: pt, pt_BR, pt_PT  
Language: Swedish, Code: sv, sv_SE  
Language: Norwegian, Code: nb, nb_NO, nn, nn_NO  
Language: Lithuanian, Code: lt, lt_LT  

Time zone

By default, the Timeline displays time in local time. To display a Timeline in another time zone or in UTC, the date constructor can be overloaded via the configuration option moment, which by default is the constructor function of moment.js.

Styles

All parts of the Timeline have a class name and a default css style. The styles can be overwritten, which enables full customization of the layout of the Timeline.

Grid Backgrounds

The background grid of the time axis can be styled, for example to highlight weekends or to create grids with an alternating white/lightgray background.

Depending on the zoom level, the grids get certain css classes attached. The following classes are available:

Description: Alternating columns, Values: vis-even, vis-odd  
Description: Current date, Values: vis-today, vis-tomorrow, vis-yesterday, vis-current-week, vis-current-month, vis-current-year  
Description: Hours, Values: vis-h0, vis-h1, ..., vis-h23  
Description: Grouped hours, Values: vis-h0-h4 to vis-h20-h24  
Description: Weekday, Values: vis-monday, vis-tuesday, vis-wednesday, vis-thursday, vis-friday, vis-saturday, vis-sunday  
Description: Days, Values: vis-day1, vis-day2, ..., vis-day31  
Description: Week, Values: vis-week1, vis-week2, ..., vis-week53  
Description: Months, Values: vis-january, vis-february, vis-march, vis-april, vis-may, vis-june, vis-july, vis-august, vis-september, vis-october, vis-november, vis-december  
Description: Years, Values: vis-year2014, vis-year2015, ...  

Performance Tips

Defining a timeline with many items and/or groups might affect initial loading time and general performance. Here are some tips to improve performance and avoid slow loading time:

Define items and group with DataSets.  
Avoid applying heavy CSS on items (such as box-shadow, gradient background colors, etc.).  
Defining a start and an end in the timeline options. This will improve initial loading time.