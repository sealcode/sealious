(typeof exports !== "undefined" ? exports : window).travisCov = (function(){
    var main = {
      check: function(cov,userOptions){
        if (!cov){
          return false;
        }
        
        var options = {
          threshold: 50 //defaults to 50%
        };

        if (userOptions){
          options.threshold = userOptions.threshold || options.threshold;
        }

        var totals =[];
        for (var filename in cov) {
          var data = cov[filename];
          totals.push(this.reportFile( data,options));
        }
        
        var totalHits = 0;
        var totalSloc = 0;
        totals.forEach(function(elem){
          totalHits += elem[0];
          totalSloc += elem[1];
        });
        
        var globCoverage = (totalHits === 0 || totalSloc === 0) ?
                              0 : totalHits / totalSloc * 100;
        console.log("Coverage: "+Math.floor(globCoverage)+"%");
        if (globCoverage < options.threshold || isNaN(globCoverage)){
          console.log("Code coverage below threshold: "+Math.floor(globCoverage)+ " < "+options.threshold);
          if (typeof process !== "undefined"){
            process.exit(1);
          }
          return false;
          
        }else{
          console.log("Coverage succeeded.");
        }
        return true;
      },
      reportFile: function( data,options) {
        var ret = {
          coverage: 0,
          hits: 0,
          misses: 0,
          sloc: 0
        };
        data.source.forEach(function(line, num){
          num++;
          if (data[num] === 0) {
            ret.misses++;
            ret.sloc++;
          } else if (data[num] !== undefined) {
            ret.hits++;
            ret.sloc++;
          }
        });
        ret.coverage = ret.hits / ret.sloc * 100;

        return [ret.hits,ret.sloc];
        
      }
  };
  return main;
})();