require("regenerator-runtime/runtime");
const { ApolloServer, gql } = require("apollo-server-micro");
const fs = require("fs");
const path = require("path");
const emuto = require("node-emuto");
const { get } = require("httpie");
const convert = require("xml-js");
const cors = require("micro-cors")();

const transformPath = path.resolve(__dirname, "feedTransform.emu");
const transformString = fs.readFileSync(transformPath, "utf8");
const compliedTransform = emuto(transformString);

const typeDefs = gql`
	type Feed {
		id: String
		title: String
		feedURL: String
		published: String
		link: String
		items: [Item]
	}

	type Item {
		id: String
		title: String
		author: String
		updated: String
		published: String
		image: String
		link: String
	}

	type Query {
		feed(url: String!): Feed
		feeds(urls: [String!]!): [Feed]
	}
`;

const getFeed = async (url) => {
	const { data } = await get(url);
	const result = convert.xml2js(data, { compact: true });
	const tranformedResult = compliedTransform(result);
	return tranformedResult;
};

const resolvers = {
	Query: {
		feed: async (_, args) => {
			const feed = await getFeed(args.url);
			return feed;
		},
		feeds: async (_, args) => {
			const feeds = await Promise.all(args.urls.map(getFeed));
			return feeds;
		},
	},
};

const apolloServer = new ApolloServer({
	typeDefs,
	resolvers,
	playground: true,
	introspection: true,
});

const handler = apolloServer.createHandler({ path: "/api/graphql" });

module.exports = cors((req, res) => {
	if (req.method === "OPTIONS") {
		res.end();
		return;
	}
	return handler(req, res);
});
