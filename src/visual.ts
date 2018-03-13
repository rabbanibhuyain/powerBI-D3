
module powerbi.extensibility.visual {
    "use strict";
    interface DataPoint {
        category: string;
        value: number;
        color:string;
        identity:powerbi.visuals.ISelectionId;
    };

    interface ViewModel {
        dataPoints: DataPoint[];
        maxValue: number;
    }
    export class Visual implements IVisual {

        private settings: VisualSettings;

        private host: IVisualHost;
        private svg: d3.Selection<SVGAElement>;
        private barGroup: d3.Selection<SVGAElement>;
        private selectionManager:ISelectionManager;

        private xPadding: number = 0.1;



        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.svg = d3.select(options.element)
                .append("svg")
                .classed("bar-chart", true);

            this.barGroup = this.svg.append("g").classed("bar-group", true);
            this.selectionManager = this.host.createSelectionManager();
            console.log("Options Data: ", options)
        }

        public update(options: VisualUpdateOptions) {
 

            let viewModel: ViewModel = this.getViewModel(options, this.host);

            console.log("Sample View Model:", viewModel);
            let xMargin = (options.viewport.width*.05);
            let yMargin = (options.viewport.width*.05);

            let width = options.viewport.width-xMargin;
            let height = options.viewport.height-yMargin;
            this.svg.attr({
                width:width,
                height: height
            });

            let yScale = d3.scale.linear().domain([0, viewModel.maxValue]).range([height, 0]);
            let xScale = d3.scale.ordinal().domain(viewModel.dataPoints.map(d => d.category)).rangeRoundBands([0, width], this.xPadding);
            
           // let xAxis = d3.svg.axis().scale(xScale).orient("top");
            let yAxis = d3.svg.axis().scale(yScale).orient("right").ticks(10);
            
           // this.barGroup.call(xAxis);
            this.barGroup.call(yAxis);
            let bars = this.barGroup
                .selectAll(".bar")
                .data(viewModel.dataPoints);

          
            bars.enter()
                .append("rect")
                .classed("bar",true).attr({
                width: xScale.rangeBand(),
                height: d=> height - yScale(d.value)-5,
                y: d=>yScale(d.value),
                x: d=>xScale(d.category)+xMargin
            }).style({
                fill:d=>d.color
            }).on("click", d=>{
                this.selectionManager.select(d.identity,true);
            })
            
            bars.enter().append("text").attr({
                y: d=>(height + yScale(d.value))/2,
                x: d=>xScale(d.category)+xScale.rangeBand()/2 +xMargin,
                "stroke-width":"1px",
                "font-size":"12px",
                "text-anchor":"middle",
                stroke:"white",
            }).text(d=>d.category);
            console.log("xScale Range Band: ", xScale.rangeBand());
            console.log("bars: ", bars);
            console.log("svg: ", this.svg);
            
            bars.exit().remove();
            bars.exit().remove();


        }

        private getViewModel(options:VisualUpdateOptions, argHost:IVisualHost):ViewModel{
            let dataView = options.dataViews;
            let retDataView : ViewModel={
                dataPoints:[],
                maxValue:0
            }

            if(!dataView || !dataView[0] 
                || !dataView[0].categorical || !dataView[0].categorical.categories
                || !dataView[0].categorical.categories[0].source 
                || !dataView[0].categorical.values)
                return retDataView;
            let view = dataView[0].categorical;
            let categories=view.categories[0];
            let values = view.values[0];
            
            let len = Math.max(categories.values.length, values.values.length);
            for (let i = 0; i < len; i++) {
               retDataView.dataPoints.push({
                   category:<string>categories.values[i],
                   value:<number>values.values[i],
                   color:argHost.colorPalette.getColor(<string>categories.values[i]).value,
                   identity:argHost.createSelectionIdBuilder().withCategory(categories,i).createSelectionId()
               });
                
            }
            retDataView.maxValue=d3.max(retDataView.dataPoints, d=>d.value);
            return retDataView;
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}