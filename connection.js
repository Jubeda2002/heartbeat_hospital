var mysql=require("mysql");
var util=require("util");
var conn=mysql.createConnection({
	"host":"bjnmpeouy2bpkvj9fgrb-mysql.services.clever-cloud.com",
	"user":"bjnmpeouy2bpkvj9fgrb",
	"password":"u3pydhi1dzligm6q",
	"database":"D61WNAGRZVkklIjoGGpj"
});
var exe=util.promisify(conn.query).bind(conn);
module.exports=exe;

