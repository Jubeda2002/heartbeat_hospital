var mysql=require("mysql2");
var util=require("util");
var conn=mysql.createConnection({
	"host":"bjnmpeouy2bpkvj9fgrb-mysql.services.clever-cloud.com",
	"user":"u3pydhi1dzligm6q",
	"password":"D61WNAGRZVkklIjoGGpj",
	"database":"bjnmpeouy2bpkvj9fgrb"
});
var exe=util.promisify(conn.query).bind(conn);
module.exports=exe;

